import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/tokenStore";

const GMAIL_API_URL = "https://www.googleapis.com/gmail/v1/users/me";

export async function GET(request: NextRequest) {
  try {
    // Get the user email from query params or headers
    const email = request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Retrieve the stored access token
    const accessToken = getToken(email);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found for this email. Please reconnect." },
        { status: 401 }
      );
    }

    // Fetch the list of messages from Gmail
    const messagesResponse = await fetch(`${GMAIL_API_URL}/messages?maxResults=20&q=in:inbox`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!messagesResponse.ok) {
      if (messagesResponse.status === 401) {
        console.error("[Gmail API] Unauthorized - token may be expired");
        return NextResponse.json(
          { error: "Access token expired. Please reconnect." },
          { status: 401 }
        );
      }
      const errorText = await messagesResponse.text();
      console.error("[Gmail API] Messages list failed:", messagesResponse.status, errorText);
      return NextResponse.json(
        { error: `Gmail API error: ${messagesResponse.status}` },
        { status: messagesResponse.status }
      );
    }

    const messagesData = (await messagesResponse.json()) as {
      messages?: Array<{ id: string; threadId: string }>;
      resultSizeEstimate?: number;
    };

    if (!messagesData.messages || messagesData.messages.length === 0) {
      console.log("[Gmail API] No messages found in inbox");
      return NextResponse.json({
        emails: [],
        total: 0,
      });
    }

    // Fetch full details for each message
    const emailPromises = messagesData.messages.map((msg) =>
      fetch(`${GMAIL_API_URL}/messages/${msg.id}?format=full`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error("[Gmail API] Failed to fetch message:", msg.id, err);
          return null;
        })
    );

    const messageDetails = await Promise.all(emailPromises);

    // Transform Gmail messages into our Email format
    const emails = messageDetails
      .filter((msg) => msg !== null)
      .map((msg) => {
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: { name: string }) => h.name === name)?.value || "";

        const subject = getHeader("Subject") || "(No Subject)";
        const from = getHeader("From") || "Unknown";
        const preview = getPreview(msg.payload);

        return {
          id: msg.id,
          from,
          subject,
          preview,
          body: getBody(msg.payload),
          date: new Date(parseInt(msg.internalDate)).toLocaleString(),
          category: null as any,
          summary: null as any,
          analyzed: false,
        };
      });

    console.log("[Gmail API] Successfully fetched", emails.length, "emails for", email);

    return NextResponse.json({
      emails,
      total: messagesData.resultSizeEstimate || emails.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Gmail API] Fetch error:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to fetch emails: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Extract the preview/snippet from a Gmail message
 */
function getPreview(payload: any): string {
  if (!payload) return "";

  // Try to get text from parts
  const parts = payload.parts || [];
  const textPart = parts.find(
    (p: any) => p.mimeType === "text/plain"
  );

  if (textPart && textPart.body?.data) {
    const text = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    return text.substring(0, 200); // First 200 chars
  }

  // Fallback to body if available
  if (payload.body?.data) {
    const text = Buffer.from(payload.body.data, "base64").toString("utf-8");
    return text.substring(0, 200);
  }

  return "";
}

/**
 * Extract the full body from a Gmail message
 */
function getBody(payload: any): string {
  if (!payload) return "";

  // Try to get text from parts
  const parts = payload.parts || [];
  const textPart = parts.find(
    (p: any) => p.mimeType === "text/plain"
  );

  if (textPart && textPart.body?.data) {
    return Buffer.from(textPart.body.data, "base64").toString("utf-8");
  }

  // Fallback to body if available
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return "";
}
