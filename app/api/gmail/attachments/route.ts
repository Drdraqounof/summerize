import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/tokenStore";

const GMAIL_API_URL = "https://www.googleapis.com/gmail/v1/users/me";

interface GmailAttachmentResponse {
  data?: string;
  size?: number;
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const messageId = request.nextUrl.searchParams.get("messageId");
  const attachmentId = request.nextUrl.searchParams.get("attachmentId");
  const mimeType = request.nextUrl.searchParams.get("mimeType") || "application/octet-stream";

  if (!email || !messageId || !attachmentId) {
    return NextResponse.json(
      { error: "email, messageId, and attachmentId are required" },
      { status: 400 },
    );
  }

  const accessToken = getToken(email);
  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token found for this email. Please reconnect." },
      { status: 401 },
    );
  }

  const attachmentResponse = await fetch(
    `${GMAIL_API_URL}/messages/${messageId}/attachments/${attachmentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!attachmentResponse.ok) {
    const errorText = await attachmentResponse.text();
    console.error(
      "[Gmail Attachments] Failed to fetch attachment:",
      attachmentResponse.status,
      errorText,
    );

    return NextResponse.json(
      { error: `Gmail attachment error: ${attachmentResponse.status}` },
      { status: attachmentResponse.status },
    );
  }

  const attachmentData = (await attachmentResponse.json()) as GmailAttachmentResponse;
  if (!attachmentData.data) {
    return NextResponse.json(
      { error: "Attachment data was empty" },
      { status: 404 },
    );
  }

  const normalized = attachmentData.data.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(normalized, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(buffer.byteLength),
      "Content-Type": mimeType,
    },
  });
}