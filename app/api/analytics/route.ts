import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type AnalyticsPeriod = "week" | "month" | "all";

export interface AnalyticsData {
  period: AnalyticsPeriod;
  totalEmails: number;
  flaggedEmails: number;
  categoryBreakdown: Record<string, number>;
  dailyVolume: { date: string; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; urgent: number };
  topContacts: { senderEmail: string; displayName: string | null; emailCount: number }[];
  inboxHealthScore: number;
  avgReplyRate: number;
  estimatedTimeSaved: number;
  totalContacts: number;
}

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  switch (period) {
    case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all": return new Date(0);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get("userEmail")?.toLowerCase().trim();
    const period = (request.nextUrl.searchParams.get("period") || "week") as AnalyticsPeriod;

    if (!userEmail) {
      return NextResponse.json({ error: "Missing userEmail" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const periodStart = getPeriodStart(period);

    const [
      totalEmails,
      flaggedEmails,
      categoryRecords,
      sentiments,
      dailyData,
      contacts,
      totalContacts,
      replyRateData,
    ] = await Promise.all([
      prisma.email.count({ where: { userId: user.id, receivedAt: { gte: periodStart } } }),
      prisma.email.count({ where: { userId: user.id, isFlagged: true, receivedAt: { gte: periodStart } } }),
      prisma.emailCategoryRecord.findMany({
        where: { email: { userId: user.id, receivedAt: { gte: periodStart } } },
        select: { category: true },
      }),
      prisma.email.findMany({
        where: { userId: user.id, sentiment: { not: null }, receivedAt: { gte: periodStart } },
        select: { sentiment: true },
      }),
      prisma.email.findMany({
        where: { userId: user.id, receivedAt: { gte: periodStart } },
        select: { receivedAt: true },
        orderBy: { receivedAt: "asc" },
      }),
      prisma.contact.findMany({
        where: { userId: user.id },
        orderBy: { emailCount: "desc" },
        take: 10,
        select: { senderEmail: true, displayName: true, emailCount: true },
      }),
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.contact.findMany({
        where: { userId: user.id, replyRate: { gt: 0 } },
        select: { replyRate: true },
      }),
    ]);

    const trackedCategories = new Set(["Work", "Personal", "Promotions", "Alerts"]);
    const categoryBreakdown: Record<string, number> = {};
    for (const record of categoryRecords) {
      if (!trackedCategories.has(record.category)) continue;
      categoryBreakdown[record.category] = (categoryBreakdown[record.category] || 0) + 1;
    }

    const sentimentBreakdown = { positive: 0, neutral: 0, urgent: 0 };
    for (const email of sentiments) {
      if (email.sentiment === "positive") sentimentBreakdown.positive++;
      else if (email.sentiment === "urgent") sentimentBreakdown.urgent++;
      else sentimentBreakdown.neutral++;
    }

    const dailyVolumeMap = new Map<string, number>();
    for (const email of dailyData) {
      if (email.receivedAt) {
        const dateKey = email.receivedAt.toISOString().slice(0, 10);
        dailyVolumeMap.set(dateKey, (dailyVolumeMap.get(dateKey) || 0) + 1);
      }
    }
    const dailyVolume = Array.from(dailyVolumeMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const inboxHealthScore = totalEmails > 0
      ? Math.round((categoryRecords.length / totalEmails) * 100)
      : 0;

    const avgReplyRate = replyRateData.length > 0
      ? Math.round(replyRateData.reduce((sum: number, c: { replyRate: number }) => sum + c.replyRate, 0) / replyRateData.length)
      : 0;

    const estimatedTimeSaved = Math.round(totalEmails * 0.033 * 10) / 10;

    return NextResponse.json({
      period,
      totalEmails,
      flaggedEmails,
      categoryBreakdown,
      dailyVolume,
      sentimentBreakdown,
      topContacts: contacts,
      inboxHealthScore,
      avgReplyRate,
      estimatedTimeSaved,
      totalContacts,
    } satisfies AnalyticsData);
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
