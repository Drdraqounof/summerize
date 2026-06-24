import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get("userEmail")?.toLowerCase().trim();
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase().trim();
    const sort = request.nextUrl.searchParams.get("sort") || "emailCount";

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

    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        ...(search ? {
          OR: [
            { senderEmail: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: sort === "name"
        ? { displayName: "asc" }
        : sort === "lastEmailAt"
        ? { lastEmailAt: "desc" }
        : { emailCount: "desc" },
      take: 100,
    });

    const mapped = contacts.map((c: { id: string; senderEmail: string; displayName: string | null; emailCount: number; importance: number; sentimentScore: number; lastEmailAt: Date; avgResponseTime: number | null; replyRate: number; lastSentiment: string | null }) => {
      let sentiment: "positive" | "neutral" | "urgent" = "neutral";
      if (c.lastSentiment === "positive" || c.lastSentiment === "urgent") {
        sentiment = c.lastSentiment;
      }

      return {
        id: c.id,
        senderEmail: c.senderEmail,
        displayName: c.displayName,
        emailCount: c.emailCount,
        importance: c.importance,
        sentimentScore: c.sentimentScore,
        sentiment,
        lastEmailAt: c.lastEmailAt.toISOString(),
        avgResponseTime: c.avgResponseTime,
        replyRate: c.replyRate,
      };
    });

    return NextResponse.json({ contacts: mapped });
  } catch (error) {
    console.error("[Contacts API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
