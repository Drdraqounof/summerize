import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/tokenStore";
import { syncGmailLabel, type SyncLabel } from "@/lib/gmail-sync";
import { analyzeUnanalyzedEmails } from "@/lib/email-analysis";

type SyncPeriod = "week" | "month" | "all";

function getSyncConfig(period: SyncPeriod): { since: Date | undefined; maxPerLabel: number } {
  const now = new Date();
  switch (period) {
    case "week":
      return { since: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), maxPerLabel: 500 };
    case "month":
      return { since: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), maxPerLabel: 500 };
    case "all":
      return { since: undefined, maxPerLabel: 2000 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, period } = await request.json() as {
      userEmail?: string;
      period?: string;
    };

    if (!userEmail || !["week", "month", "all"].includes(period || "")) {
      return NextResponse.json(
        { error: "userEmail and period (week|month|all) are required" },
        { status: 400 }
      );
    }

    const email = userEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accessToken = getToken(email);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found. Please reconnect Gmail." },
        { status: 401 }
      );
    }

    const { since, maxPerLabel } = getSyncConfig(period as SyncPeriod);
    const labels: SyncLabel[] = ["inbox", "spam", "promotions", "updates", "trash"];

    let totalSynced = 0;
    let totalTruncated = false;

    // Sync each label sequentially to avoid rate limits
    for (const label of labels) {
      try {
        const result = await syncGmailLabel(accessToken, email, user.id, label, since, maxPerLabel);
        totalSynced += result.synced;
        if (result.truncated) totalTruncated = true;
      } catch (error) {
        console.error(`[Sync] Failed to sync label ${label}:`, error);
        // Continue with other labels even if one fails
      }
    }

    // Analyze newly fetched emails
    const analyzed = await analyzeUnanalyzedEmails(user.id, since);

    console.log(`[Sync] Complete - synced: ${totalSynced}, analyzed: ${analyzed}`);

    return NextResponse.json({
      synced: totalSynced,
      analyzed,
      truncated: totalTruncated,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Sync] Error:", errorMessage, error);
    return NextResponse.json(
      { error: `Sync failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
