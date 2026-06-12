import OpenAI from "openai";
import { prisma } from "./prisma";
import { isMissingEmailNotificationColumnError, supportsEmailNotificationPersistence } from "./email-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analysisCache = new Map<string, AnalysisResult>();

export interface AnalysisResult {
  category: string;
  summary: string;
  shouldNotify: boolean;
  matchReason: string;
  isStarred: boolean;
}

export interface ScanPreferences {
  aiExperience?: string;
  focusAreas?: string[];
  assistantStyle?: string;
  notificationFrequency?: string;
}

function buildPromptContext(scanPreferences?: ScanPreferences): string {
  if (!scanPreferences) return "No user-specific watchlist was provided.";
  const sections = [
    scanPreferences.aiExperience ? `AI familiarity: ${scanPreferences.aiExperience}` : "",
    scanPreferences.focusAreas?.length ? `Priority topics: ${scanPreferences.focusAreas.join("; ")}` : "",
    scanPreferences.assistantStyle ? `Preferred help style: ${scanPreferences.assistantStyle}` : "",
    scanPreferences.notificationFrequency ? `Notification cadence: ${scanPreferences.notificationFrequency}` : "",
  ].filter(Boolean);
  return sections.length > 0 ? sections.join("\n") : "No user-specific watchlist was provided.";
}

function cleanEmailBody(body: string): string {
  if (!body) return "";
  let cleaned = body;
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      if (/view job|apply|apply with|view profile|see all jobs|learn why|manage your|unsubscribe|this company is actively|stand out|let hirers/i.test(line)) return "";
      if (/^[\s\-·•|]+$/.test(line)) return "";
      if (/^you are receiving|this email was intended|learn why we included|©.*linkedin/i.test(line)) return "";
      return line;
    })
    .join("\n");
  cleaned = cleaned.split(/^---+/m)[0];
  cleaned = cleaned.split(/^This email was intended/m)[0];
  cleaned = cleaned.split(/^You are receiving/m)[0];
  cleaned = cleaned.split(/^Manage your job alerts/m)[0];
  cleaned = cleaned.replace(/\?[a-zA-Z0-9=&%\-_.~]+/g, "");
  cleaned = cleaned.replace(/&[a-zA-Z0-9=&%\-_.~]+/g, "");
  cleaned = cleaned.replace(/=[a-zA-Z0-9%\-_.~]+/g, "");
  cleaned = cleaned.replace(/midToken|midSig|eid|otpToken|lipi|trk|trackingId/gi, "");
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const hasContent =
        line.length > 3 &&
        !/^[\s\-·•|]*$/.test(line) &&
        !/^(view|apply|learn|manage|help|unsubscribe)/i.test(line) &&
        !/^(this|you are|©|·)/i.test(line) &&
        !/linkedin|midtoken|midsig|eid|otptoken|lipi|trk|@|utm_/i.test(line);
      return hasContent;
    });
  let final = lines.join("\n").trim();
  final = final.replace(/\n\n\n+/g, "\n\n");
  final = final
    .split("\n")
    .filter((line) => !/^[a-zA-Z0-9%]{20,}/.test(line) && !/^[0-9a-f]{20,}/.test(line))
    .join("\n");
  return final.substring(0, 1200).trim();
}

export async function batchAnalyzeEmails(
  emails: Array<{ id: string; subject: string; body: string }>,
  scanPreferences?: ScanPreferences,
): Promise<Record<string, AnalysisResult>> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Email Analysis] No OPENAI_API_KEY configured, skipping analysis");
    return {};
  }

  const results: Record<string, AnalysisResult> = {};
  const promptContext = buildPromptContext(scanPreferences);

  const batches = [];
  for (let i = 0; i < emails.length; i += 5) {
    batches.push(emails.slice(i, i + 5));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (email) => {
        if (analysisCache.has(email.id)) {
          results[email.id] = analysisCache.get(email.id)!;
          return;
        }
        try {
          const cleanedBody = cleanEmailBody(email.body);
          const emailContent = `Subject: ${email.subject}\n\nBody:\n${cleanedBody}`;
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Analyze email and respond with ONLY valid JSON:
{
  "category": "Work|Personal|Promotions|Alerts|Other",
  "summary": "brief summary max 100 chars",
  "shouldNotify": true,
  "matchReason": "short reason why this matches the user's watchlist, or 'General inbox item'",
  "isStarred": true
}

Star exactly ONE email per batch as the most important email in that folder (set isStarred=true). Use shouldNotify=true only when the email clearly matches the user's watchlist or stated goal.
User watchlist:
${promptContext}`,
              },
              {
                role: "user",
                content: emailContent,
              },
            ],
            temperature: 0.2,
            max_tokens: 220,
          });
          const content = response.choices[0]?.message?.content;
          if (content) {
            const result = JSON.parse(content);
            results[email.id] = result;
            analysisCache.set(email.id, result);
          }
        } catch (error) {
          console.error(`[Email Analysis] Failed to analyze email ${email.id}:`, error);
          results[email.id] = {
            category: "Other",
            summary: "Analysis failed",
            shouldNotify: false,
            matchReason: "General inbox item",
            isStarred: false,
          };
        }
      }),
    );
  }

  console.log(`[Email Analysis] OpenAI batch results: ${Object.keys(results).length}/${emails.length} emails analyzed`);
  return results;
}

export async function persistAnalysisResult(userId: string, gmailId: string, result: AnalysisResult) {
  const email = await prisma.email.findFirst({
    where: { userId, gmailId },
    select: { id: true },
  });
  if (!email) return;

  const supportsNotificationPersistence = await supportsEmailNotificationPersistence();

  const data: Record<string, unknown> = {
    summary: result.summary,
    analyzedAt: new Date(),
    isStarred: result.isStarred,
  };

  if (result.category) {
    data.category = {
      upsert: {
        create: { category: result.category, aiModel: "gpt-4o-mini" },
        update: { category: result.category, aiModel: "gpt-4o-mini" },
      },
    } as { upsert: { create: { category: string; aiModel: string }; update: { category: string; aiModel: string } } };
  }

  if (supportsNotificationPersistence) {
    data.shouldNotify = result.shouldNotify;
    data.matchReason = result.matchReason;
  }

  try {
    await prisma.email.update({ where: { id: email.id }, data });
  } catch (error) {
    if (!isMissingEmailNotificationColumnError(error)) throw error;
  }
}

export async function analyzeUnanalyzedEmails(
  userId: string,
  since?: Date,
  scanPreferences?: ScanPreferences,
): Promise<number> {
  const whereClause: Record<string, unknown> = { userId, analyzedAt: null };
  if (since) whereClause.receivedAt = { gte: since };

  const allUnanalyzed = await prisma.email.count({
    where: { userId, analyzedAt: null },
  });
  console.log(`[Email Analysis] Total unanalyzed emails for user: ${allUnanalyzed}`);

  const unanalyzed = await prisma.email.findMany({
    where: whereClause,
    select: { id: true, gmailId: true, subject: true, body: true },
  });

  if (unanalyzed.length === 0) {
    console.log(`[Email Analysis] No unanalyzed emails found in period window`);
    return 0;
  }
  console.log(`[Email Analysis] Found ${unanalyzed.length} unanalyzed emails in period`);

  const analysisInput = unanalyzed
    .filter((e: { gmailId?: string | null; subject?: string | null; body?: string | null }) => e.gmailId && e.subject && e.body)
    .map((e: { gmailId: string; subject: string; body: string }) => ({ id: e.gmailId, subject: e.subject, body: e.body }));

  if (analysisInput.length === 0) {
    console.log(`[Email Analysis] All ${unanalyzed.length} unanalyzed emails filtered out (missing gmailId/subject/body)`);
    return 0;
  }
  console.log(`[Email Analysis] Sending ${analysisInput.length} emails to OpenAI`);

  const results = await batchAnalyzeEmails(analysisInput, scanPreferences);

  let analyzed = 0;
  await Promise.all(
    Object.entries(results).map(async ([gmailId, result]) => {
      await persistAnalysisResult(userId, gmailId, result);
      analyzed++;
    }),
  );

  console.log(`[Email Analysis] Analyzed ${analyzed} emails (attempted ${analysisInput.length})`);
  // Log how many categorized vs uncategorized remain
  const total = await prisma.email.count({ where: { userId } });
  const categorized = await prisma.email.count({ where: { userId, category: { isNot: null } } });
  const stillNull = await prisma.email.count({ where: { userId, analyzedAt: null } });
  console.log(`[Email Analysis] DB totals - total: ${total}, categorized: ${categorized}, unanalyzed: ${stillNull}`);
  return analyzed;
}
