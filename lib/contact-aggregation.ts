/**
 * Contact Aggregation Engine
 * Computes relationship metrics from email history
 */

import { prisma } from "./prisma";

export interface ContactMetrics {
  email: string;
  displayName: string;
  emailCount: number;
  firstEmailAt: Date | null;
  lastEmailAt: Date | null;
  importance: number; // 0-10 scale
  sentiment: "positive" | "neutral" | "urgent"; // most common sentiment
  avgResponseTime?: number; // minutes
  replyRate: number; // percentage (0-100)
  lastSentiment?: "positive" | "neutral" | "urgent";
}

/**
 * Extract sender email and display name from "Name <email@domain>" format
 */
function parseEmailAddress(fromField: string): { email: string; displayName: string } {
  const emailMatch = fromField.match(/<([^>]+)>/);
  const email = emailMatch ? emailMatch[1].toLowerCase() : fromField.toLowerCase();

  const nameMatch = fromField.match(/^([^<]+)</);
  const displayName = nameMatch ? nameMatch[1].trim().replace(/^"+|"+$/g, "") : email.split("@")[0];

  return { email, displayName: displayName || email };
}

/**
 * Calculate importance score (0-10) from email patterns
 * Factors:
 * - Frequency (more emails = higher importance)
 * - Reply rate (you reply to most of theirs = higher importance)
 * - Starred emails (AI flagged as important = higher importance)
 */
function calculateImportance(
  emailCount: number,
  replyRate: number,
  starredCount: number,
  maxEmailsInDB: number = 1000
): number {
  const frequencyScore = Math.min((emailCount / (maxEmailsInDB * 0.1)) * 3, 3); // max 3 points
  const replyScore = (replyRate / 100) * 4; // max 4 points
  const starScore = Math.min((starredCount / (emailCount * 0.2)) * 3, 3); // max 3 points

  const total = frequencyScore + replyScore + starScore;
  return Math.min(Math.round(total), 10);
}

/**
 * Calculate average response time in minutes
 * Looks at times between received emails and user's replies
 */
async function calculateAvgResponseTime(userId: string, senderEmail: string): Promise<number | undefined> {
  // Get pairs of (sender email, user reply) sorted by timestamp
  const emailPairs = await prisma.$queryRaw<
    Array<{ sentTime: Date; replyTime: Date }>
  >`
    SELECT 
      e1."receivedAt" as "sentTime",
      e2."receivedAt" as "replyTime"
    FROM "Email" e1
    JOIN "Email" e2 ON e1."threadId" = e2."threadId" 
      AND e1."gmailId" != e2."gmailId"
      AND e1."from" ILIKE ${senderEmail}
      AND e2."from" != ${senderEmail}
      AND e2."userId" = ${userId}
      AND e1."receivedAt" < e2."receivedAt"
    WHERE e1."userId" = ${userId}
    ORDER BY e1."receivedAt" DESC
    LIMIT 10
  `;

  if (!emailPairs || emailPairs.length === 0) return undefined;

  const responseTimes = emailPairs.map((pair: { sentTime: Date; replyTime: Date }) => {
    const minutes = (new Date(pair.replyTime).getTime() - new Date(pair.sentTime).getTime()) / (1000 * 60);
    return Math.max(minutes, 0);
  });

  const avgTime = responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length;
  return Math.round(avgTime);
}

/**
 * Get most common sentiment from recent emails
 */
function getMostCommonSentiment(sentiments: (string | null)[]): "positive" | "neutral" | "urgent" {
  const validSentiments = sentiments.filter((s): s is string => s !== null);
  if (validSentiments.length === 0) return "neutral";

  const counts = validSentiments.reduce(
    (acc, s) => {
      acc[s as "positive" | "neutral" | "urgent"] = (acc[s as "positive" | "neutral" | "urgent"] || 0) + 1;
      return acc;
    },
    {} as Record<"positive" | "neutral" | "urgent", number>
  );

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0] as "positive" | "neutral" | "urgent";
}

/**
 * Aggregate contact metrics from all emails with this sender
 */
export async function aggregateContactMetrics(userId: string, senderEmailRaw: string): Promise<ContactMetrics | null> {
  const { email: senderEmail, displayName } = parseEmailAddress(senderEmailRaw);

  // Query all emails from this sender
  const emails = await prisma.email.findMany({
    where: {
      userId,
      from: {
        contains: senderEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      receivedAt: true,
      isFlagged: true,
      sentiment: true,
      from: true,
    },
    orderBy: { receivedAt: "desc" },
  });

  if (emails.length === 0) return null;

  const emailCount = emails.length;
  const starredCount = emails.filter((e: { isFlagged: boolean }) => e.isFlagged).length;
  const firstEmailAt = emails[emailCount - 1]?.receivedAt || null;
  const lastEmailAt = emails[0]?.receivedAt || null;

  // Calculate reply rate (rough estimate: # of starred / total)
  const replyRate = emailCount > 0 ? Math.round((starredCount / emailCount) * 100) : 0;

  // Calculate importance score
  const importance = calculateImportance(emailCount, replyRate, starredCount);

  // Get average response time
  const avgResponseTime = await calculateAvgResponseTime(userId, senderEmail);

  // Get most common sentiment
  const sentiment = getMostCommonSentiment(emails.map((e: { sentiment: string | null }) => e.sentiment));
  const lastSentiment = emails[0]?.sentiment as "positive" | "neutral" | "urgent" | undefined;

  return {
    email: senderEmail,
    displayName,
    emailCount,
    firstEmailAt,
    lastEmailAt,
    importance,
    sentiment,
    avgResponseTime,
    replyRate,
    lastSentiment,
  };
}

/**
 * Upsert Contact record with aggregated metrics
 * Called after batch email analysis to keep Contact table up-to-date
 */
export async function upsertContact(userId: string, senderEmail: string): Promise<void> {
  try {
    const metrics = await aggregateContactMetrics(userId, senderEmail);
    if (!metrics) return;

    await prisma.contact.upsert({
      where: {
        userId_senderEmail: {
          userId,
          senderEmail: metrics.email,
        },
      },
      create: {
        userId,
        senderEmail: metrics.email,
        displayName: metrics.displayName,
        emailCount: metrics.emailCount,
        firstEmailAt: metrics.firstEmailAt,
        lastEmailAt: metrics.lastEmailAt,
        importance: metrics.importance,
        sentimentScore: metrics.sentiment === "positive" ? 1.0 : metrics.sentiment === "urgent" ? 0.0 : 0.5,
        replyRate: metrics.replyRate,
        avgResponseTime: metrics.avgResponseTime,
        lastSentiment: metrics.lastSentiment,
      },
      update: {
        displayName: metrics.displayName,
        emailCount: metrics.emailCount,
        firstEmailAt: metrics.firstEmailAt,
        lastEmailAt: metrics.lastEmailAt,
        importance: metrics.importance,
        sentimentScore: metrics.sentiment === "positive" ? 1.0 : metrics.sentiment === "urgent" ? 0.0 : 0.5,
        replyRate: metrics.replyRate,
        avgResponseTime: metrics.avgResponseTime,
        lastSentiment: metrics.lastSentiment,
      },
    });

    console.log(`[Contact Aggregation] Updated contact: ${metrics.email} (importance: ${metrics.importance}/10)`);
  } catch (error) {
    console.error(`[Contact Aggregation] Failed to upsert contact for ${senderEmail}:`, error);
  }
}

/**
 * Batch update contacts for a user after email sync
 * Call this after syncing a batch of emails
 */
export async function updateContactsForUser(userId: string, senders: string[]): Promise<void> {
  console.log(`[Contact Aggregation] Updating contacts for ${senders.length} senders`);

  // Process senders in parallel (5 at a time to avoid overload)
  const batchSize = 5;
  for (let i = 0; i < senders.length; i += batchSize) {
    const batch = senders.slice(i, i + batchSize);
    await Promise.all(batch.map((sender) => upsertContact(userId, sender)));
  }
}
