import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailRuleActions, type RuleActions } from "@/lib/rule-engine";
import { batchAnalyzeEmails, persistAnalysisResult, type ScanPreferences } from "@/lib/email-analysis";

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

    // Batch analysis
    if (Array.isArray(body) || Array.isArray(payload.emails)) {
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
    }

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

    // Use the shared batch analyzer for a single email too
    const results = await batchAnalyzeEmails(
      [{ id: emailId || "temp", subject, body: emailBody }],
      scanPreferences,
    );
    const result = results[emailId || "temp"];

    if (!result) {
      throw new Error("Analysis returned no result");
    }

    // Apply automation rules if user exists
    let ruleActions: RuleActions = {};
    if (user) {
      const fromEmail = (payload as Record<string, unknown>).from as string || "";
      ruleActions = await getEmailRuleActions(user.id, {
        from: fromEmail,
        subject,
        body: emailBody,
        preview: emailBody.substring(0, 200),
      });
    }

    const finalResult = {
      category: ruleActions.category || result.category,
      summary: result.summary,
      shouldNotify: ruleActions.notify !== undefined ? ruleActions.notify : result.shouldNotify,
      matchReason: result.matchReason || "General inbox item",
      isStarred: ruleActions.star !== undefined ? ruleActions.star : result.isStarred,
    };

    if (user && emailId) {
      await persistAnalysisResult(user.id, emailId, finalResult);
    }

    return NextResponse.json(finalResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email analysis error:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to analyze email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
