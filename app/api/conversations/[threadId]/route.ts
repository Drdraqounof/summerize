import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateContactMetrics, type ContactMetrics } from "@/lib/contact-aggregation";

/**
 * GET /api/conversations/[threadId]
 * 
 * Fetches:
 * 1. All emails in the thread
 * 2. Contact metrics for the sender
 * 3. Extracted action items and dates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const userEmail = request.nextUrl.searchParams.get("userEmail")?.toLowerCase().trim();

    if (!userEmail || !threadId) {
      return NextResponse.json(
        { error: "Missing userEmail or threadId" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all emails in this thread
    const threadEmails = await prisma.email.findMany({
      where: {
        userId: user.id,
        threadId: threadId,
      },
      select: {
        id: true,
        gmailId: true,
        from: true,
        subject: true,
        preview: true,
        summary: true,
        receivedAt: true,
        actionItems: true,
        sentiment: true,
        isFlagged: true,
        isRead: true,
      },
      orderBy: { receivedAt: "asc" },
      take: 20, // Limit to 20 emails per conversation
    });

    if (threadEmails.length === 0) {
      return NextResponse.json(
        { error: "Thread not found or no emails in thread" },
        { status: 404 }
      );
    }

    // Get the primary sender (most common sender other than user)
    const senderCounts: Record<string, number> = {};
    threadEmails.forEach((email: { from: string }) => {
      if (!email.from.includes(userEmail)) {
        senderCounts[email.from] = (senderCounts[email.from] || 0) + 1;
      }
    });

    const primarySender = Object.entries(senderCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    // Get contact metrics for primary sender
    let contactMetrics: ContactMetrics | null = null;
    if (primarySender) {
      contactMetrics = await aggregateContactMetrics(user.id, primarySender);
    }

    // Extract all action items from thread
    const allActionItems: Array<{ task: string; deadline?: string; fromEmail: string }> = [];
    threadEmails.forEach((email: { actionItems: unknown; from: string }) => {
      const items = (email.actionItems as Array<{ task: string; deadline?: string }>) || [];
      items.forEach((item: { task: string; deadline?: string }) => {
        allActionItems.push({
          ...item,
          fromEmail: email.from,
        });
      });
    });

    // Extract all dates from thread
    const allDates = threadEmails
      .flatMap((email: { actionItems: unknown }) => {
        if (typeof email.actionItems === "string") {
          try {
            const parsed = JSON.parse(email.actionItems);
            return Array.isArray(parsed) ? parsed.map((item: { deadline?: string }) => item.deadline).filter(Boolean) : [];
          } catch {
            return [];
          }
        }
        return Array.isArray(email.actionItems)
          ? email.actionItems.map((item: { deadline?: string }) => item.deadline).filter(Boolean)
          : [];
      })
      .filter(Boolean);

    // Get other participants in thread
    const participants = Array.from(
      new Set(threadEmails.map((email: { from: string }) => email.from).filter((from: string) => !from.includes(userEmail)))
    ).slice(0, 3); // Top 3 other participants

    return NextResponse.json({
      threadId,
      emailCount: threadEmails.length,
      emails: threadEmails.map((email: { id: string; gmailId: string | null; from: string; subject: string; preview: string | null; summary: string | null; receivedAt: Date; sentiment: string | null; isFlagged: boolean; isRead: boolean }) => ({
        id: email.id,
        gmailId: email.gmailId,
        from: email.from,
        subject: email.subject,
        preview: email.preview,
        summary: email.summary,
        receivedAt: email.receivedAt,
        sentiment: email.sentiment,
        isFlagged: email.isFlagged,
        isRead: email.isRead,
      })),
      contactMetrics: contactMetrics ? {
        email: contactMetrics.email,
        displayName: contactMetrics.displayName,
        importance: contactMetrics.importance,
        emailCount: contactMetrics.emailCount,
        lastEmailAt: contactMetrics.lastEmailAt,
        avgResponseTime: contactMetrics.avgResponseTime,
        replyRate: contactMetrics.replyRate,
        sentimentScore: contactMetrics.sentiment,
      } : null,
      actionItems: allActionItems.slice(0, 5), // Top 5 action items
      importantDates: Array.from(new Set(allDates)).slice(0, 3), // Top 3 unique dates
      participants,
    });
  } catch (error) {
    console.error("[Conversations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
