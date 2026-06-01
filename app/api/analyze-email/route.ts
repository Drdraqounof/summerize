import { NextRequest, NextResponse } from "next/server";
import {
  isMissingEmailNotificationColumnError,
  supportsEmailNotificationPersistence,
} from "@/lib/email-schema";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for analyzed emails
const analysisCache = new Map<string, { category: string; summary: string; shouldNotify: boolean; matchReason: string }>();

interface AnalysisResult {
  category: string;
  summary: string;
  shouldNotify: boolean;
  matchReason: string;
}

interface ScanPreferences {
  aiExperience?: string;
  focusAreas?: string[];
  assistantStyle?: string;
  notificationFrequency?: string;
}

function buildPromptContext(scanPreferences?: ScanPreferences): string {
  if (!scanPreferences) {
    return "No user-specific watchlist was provided.";
  }

  const sections = [
    scanPreferences.aiExperience ? `AI familiarity: ${scanPreferences.aiExperience}` : "",
    scanPreferences.focusAreas?.length
      ? `Priority topics: ${scanPreferences.focusAreas.join("; ")}`
      : "",
    scanPreferences.assistantStyle ? `Preferred help style: ${scanPreferences.assistantStyle}` : "",
    scanPreferences.notificationFrequency
      ? `Notification cadence: ${scanPreferences.notificationFrequency}`
      : "",
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n") : "No user-specific watchlist was provided.";
}

// Ultra-aggressive email cleaning - removes ALL noise, keeps only core content
function cleanEmailBody(body: string): string {
  if (!body) return "";

  let cleaned = body;

  // PHASE 0: Remove all URLs completely (not just tracking ones)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");

  // PHASE 1: Remove entire lines with keywords
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      // Remove lines with action keywords
      if (
        /view job|apply|apply with|view profile|see all jobs|learn why|manage your|unsubscribe|this company is actively|stand out|let hirers/i.test(
          line
        )
      ) {
        return "";
      }
      // Remove lines that are just special characters or dashes
      if (/^[\s\-·•|]+$/.test(line)) {
        return "";
      }
      // Remove lines with email metadata
      if (
        /^you are receiving|this email was intended|learn why we included|©.*linkedin/i.test(
          line
        )
      ) {
        return "";
      }
      return line;
    })
    .join("\n");

  // PHASE 2: Remove footer sections completely
  // Remove everything after common footer markers
  cleaned = cleaned.split(/^---+/m)[0]; // Remove after separator
  cleaned = cleaned.split(/^This email was intended/m)[0]; // Remove footer section
  cleaned = cleaned.split(/^You are receiving/m)[0]; // Remove management section
  cleaned = cleaned.split(/^Manage your job alerts/m)[0]; // Remove unsubscribe section

  // PHASE 3: Remove all tracking tokens and parameters
  cleaned = cleaned.replace(/\?[a-zA-Z0-9=&%\-_.~]+/g, "");
  cleaned = cleaned.replace(/&[a-zA-Z0-9=&%\-_.~]+/g, "");
  cleaned = cleaned.replace(/=[a-zA-Z0-9%\-_.~]+/g, "");
  cleaned = cleaned.replace(/midToken|midSig|eid|otpToken|lipi|trk|trackingId/gi, "");

  // PHASE 4: Extract and preserve only meaningful content
  // Keep job titles, companies, locations, descriptions
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      // Keep if has meaningful content (job title, company name, location, description)
      const hasContent =
        line.length > 3 &&
        !/^[\s\-·•|]*$/.test(line) && // Not just special chars
        !/^(view|apply|learn|manage|help|unsubscribe)/i.test(line) && // Not action words
        !/^(this|you are|©|·)/i.test(line) && // Not metadata
        !/linkedin|midtoken|midsig|eid|otptoken|lipi|trk|@|utm_/i.test(line); // Not system stuff

      return hasContent;
    });

  // PHASE 5: Aggressive whitespace normalization
  let final = lines.join("\n").trim();

  // Remove multiple blank lines
  final = final.replace(/\n\n\n+/g, "\n\n");

  // Remove lines with only encoded characters or garbage
  final = final
    .split("\n")
    .filter(
      (line) =>
        !/^[a-zA-Z0-9%]{20,}/.test(line) && // Not long encoded string
        !/^[0-9a-f]{20,}/.test(line) // Not hex string
    )
    .join("\n");

  return final.substring(0, 1200).trim();
}

// Batch analyze multiple emails efficiently
async function batchAnalyzeEmails(
  emails: Array<{ id: string; subject: string; body: string }>,
  scanPreferences?: ScanPreferences,
) {
  const results: Record<string, AnalysisResult> = {};
  const promptContext = buildPromptContext(scanPreferences);

  // Process in parallel for speed, but with rate limiting
  const batches = [];
  for (let i = 0; i < emails.length; i += 5) {
    batches.push(emails.slice(i, i + 5));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (email) => {
        // Check cache first
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
  "matchReason": "short reason why this matches the user's watchlist, or 'General inbox item'"
}

Use shouldNotify=true only when the email clearly matches the user's watchlist or stated goal.
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
            // Cache the result
            analysisCache.set(email.id, result);
          }
        } catch (error) {
          console.error(`Failed to analyze email ${email.id}:`, error);
          results[email.id] = {
            category: "Other",
            summary: "Analysis failed",
            shouldNotify: false,
            matchReason: "General inbox item",
          };
        }
      })
    );
  }

  return results;
}

async function persistAnalysisResult(userId: string, gmailId: string, result: AnalysisResult) {
  const email = await prisma.email.findFirst({
    where: {
      userId,
      gmailId,
    },
    select: {
      id: true,
    },
  });

  if (!email) {
    return;
  }

  const supportsNotificationPersistence = await supportsEmailNotificationPersistence();

  const data: {
    analyzedAt: Date;
    category?: {
      upsert: {
        create: {
          category: string;
          aiModel: string;
        };
        update: {
          category: string;
          aiModel: string;
        };
      };
    };
    matchReason?: string;
    shouldNotify?: boolean;
    summary: string;
  } = {
    summary: result.summary,
    analyzedAt: new Date(),
    category: result.category
      ? {
          upsert: {
            create: {
              category: result.category,
              aiModel: "gpt-4o-mini",
            },
            update: {
              category: result.category,
              aiModel: "gpt-4o-mini",
            },
          },
        }
      : undefined,
  };

  if (supportsNotificationPersistence) {
    data.shouldNotify = result.shouldNotify;
    data.matchReason = result.matchReason;
  }

  try {
    await prisma.email.update({
      where: { id: email.id },
      data,
    });
  } catch (error) {
    if (isMissingEmailNotificationColumnError(error)) {
      console.warn("[Analyze Email] Skipping notification field persistence until Prisma schema is applied.");
      return;
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const payload = Array.isArray(body) ? { emails: body } : body;
    const scanPreferences = payload.scanPreferences as ScanPreferences | undefined;
    const userEmail = payload.userEmail?.trim().toLowerCase() as string | undefined;
    const user = userEmail
      ? await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        })
      : null;

    // Check if this is a batch request or single email
    if (Array.isArray(body) || Array.isArray(payload.emails)) {
      // Batch analysis
      const emails = (Array.isArray(body) ? body : payload.emails) as Array<{
        id: string;
        subject: string;
        body: string;
      }>;
      const results = await batchAnalyzeEmails(emails, scanPreferences);

      if (user) {
        await Promise.all(
          emails.map(async (email) => {
            const result = results[email.id];
            if (result) {
              await persistAnalysisResult(user.id, email.id, result);
            }
          })
        );
      }

      return NextResponse.json(results);
    } else {
      // Single email (legacy support)
      const { subject, body: emailBody, emailId } = payload as {
        subject?: string;
        body?: string;
        emailId?: string;
      };

      if (!subject || !emailBody) {
        return NextResponse.json(
          { error: "Missing subject or body" },
          { status: 400 }
        );
      }

      const cleanedBody = cleanEmailBody(emailBody);
      const emailContent = `Subject: ${subject}\n\nBody:\n${cleanedBody}`;
      const promptContext = buildPromptContext(scanPreferences);

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
  "matchReason": "short reason why this matches the user's watchlist, or 'General inbox item'"
}

Use shouldNotify=true only when the email clearly matches the user's watchlist or stated goal.
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
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(content) as AnalysisResult;

      if (user && emailId) {
        await persistAnalysisResult(user.id, emailId, {
          category: result.category,
          summary: result.summary,
          shouldNotify: Boolean(result.shouldNotify),
          matchReason: result.matchReason || "General inbox item",
        });
      }

      return NextResponse.json({
        category: result.category,
        summary: result.summary,
        shouldNotify: Boolean(result.shouldNotify),
        matchReason: result.matchReason || "General inbox item",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email analysis error:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to analyze email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
