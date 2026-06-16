import { prisma } from "./prisma";

export type DashboardPeriod = "week" | "month" | "all";

export interface DashboardStats {
  period: DashboardPeriod;
  emailsProcessed: number;
  starredEmails: number;
  categoryBreakdown: Record<string, number>;
  inboxHealthScore: number;
  rulesActive: number;
  estimatedTimeSaved: number;
  costThisPeriod: number;
  topRule: { name: string; matchCount: number } | null;
  trend: { direction: "up" | "down"; percent: number } | null;
  dailyVolume: { date: string; count: number }[];
}

function getPeriodStart(period: DashboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all":
      return new Date(0);
  }
}

function getPeriodDurationMs(period: DashboardPeriod): number {
  switch (period) {
    case "week": return 7 * 24 * 60 * 60 * 1000;
    case "month": return 30 * 24 * 60 * 60 * 1000;
    case "all": return 0;
  }
}

function getPreviousPeriodStart(period: DashboardPeriod, periodStart: Date): Date {
  if (period === "all") return periodStart;
  const durationMs = getPeriodDurationMs(period);
  return new Date(periodStart.getTime() - durationMs);
}

export async function getDashboardStats(
  userId: string,
  period: DashboardPeriod
): Promise<DashboardStats> {
  const periodStart = getPeriodStart(period);

  const [
    totalEmails,
    starredEmails,
    categoryRecords,
    categorizedCount,
    activeRules,
    aiCost,
    topRuleData,
    previousTotal,
    dailyData,
  ] = await Promise.all([
    prisma.email.count({
      where: { userId, receivedAt: { gte: periodStart } },
    }),
    prisma.email.count({
      where: { userId, isFlagged: true, receivedAt: { gte: periodStart } },
    }),
    prisma.emailCategoryRecord.findMany({
      where: {
        email: { userId, receivedAt: { gte: periodStart } },
      },
      select: { category: true },
    }),
    prisma.email.count({
      where: {
        userId,
        receivedAt: { gte: periodStart },
        category: { isNot: null },
      },
    }),
    prisma.customRule.count({
      where: { userId, isActive: true },
    }),
    prisma.aIInteraction.aggregate({
      where: { userId, createdAt: { gte: periodStart } },
      _sum: { estimatedCost: true },
    }),
    prisma.customRule.findFirst({
      where: { userId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.email.count({
      where: {
        userId,
        analyzedAt: {
          gte: getPreviousPeriodStart(period, periodStart),
          lt: periodStart,
        },
      },
    }),
    // Daily volume for trend chart
    prisma.email.findMany({
      where: { userId, receivedAt: { gte: periodStart } },
      select: { receivedAt: true },
      orderBy: { receivedAt: "asc" },
    }),
  ]);

  const trackedCategories = new Set(["Work", "Personal", "Promotions", "Alerts"]);
  const categoryBreakdown: Record<string, number> = {};
  for (const record of categoryRecords) {
    if (!trackedCategories.has(record.category)) continue;
    categoryBreakdown[record.category] = (categoryBreakdown[record.category] || 0) + 1;
  }

  const inboxHealthScore = totalEmails > 0
    ? Math.round((categorizedCount / totalEmails) * 100)
    : 0;

  const estimatedTimeSaved = Math.round(totalEmails * 0.033 * 10) / 10;
  const costThisPeriod = aiCost._sum.estimatedCost ?? 0;

  let topRule = null;
  if (topRuleData) {
    const matchCount = await prisma.email.count({
      where: {
        userId,
        matchReason: { contains: topRuleData.name, mode: "insensitive" },
        receivedAt: { gte: periodStart },
      },
    });
    if (matchCount > 0) {
      topRule = { name: topRuleData.name, matchCount };
    }
  }

  const trend: { direction: "up" | "down"; percent: number } | null =
    previousTotal > 0
      ? {
          direction: totalEmails >= previousTotal ? "up" : "down",
          percent: Math.round(((totalEmails - previousTotal) / previousTotal) * 100),
        }
      : totalEmails > 0
        ? { direction: "up", percent: 100 }
        : null;

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

  return {
    period,
    emailsProcessed: totalEmails,
    starredEmails,
    categoryBreakdown,
    inboxHealthScore,
    rulesActive: activeRules,
    estimatedTimeSaved,
    costThisPeriod,
    topRule,
    trend,
    dailyVolume,
  };
}
