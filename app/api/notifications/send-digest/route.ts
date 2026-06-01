import { NextRequest, NextResponse } from "next/server";
import { sendDigestForUser, sendDueDigests } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      sendAll?: boolean;
    };

    if (body.sendAll) {
      const results = await sendDueDigests();
      return NextResponse.json({ results });
    }

    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await sendDigestForUser(email);
    return NextResponse.json(result, { status: result.sent ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send digest.";
    console.error("[Notifications] Failed to send digest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}