import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/tokenStore";

const GMAIL_API_URL = "https://www.googleapis.com/gmail/v1/users/me";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPartBody {
  data?: string;
  attachmentId?: string;
  size?: number;
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailPartBody;
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  internalDate: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
}

interface InlineAttachment {
  attachmentId: string;
  cid: string;
  mimeType: string;
}

interface ExtractedEmailContent {
  htmlBody: string;
  inlineAttachments: InlineAttachment[];
  textBody: string;
}

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
      .filter((msg): msg is GmailMessage => msg !== null)
      .map((msg) => {
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((header) => header.name === name)?.value || "";

        const subject = getHeader("Subject") || "(No Subject)";
        const from = getHeader("From") || "Unknown";
        const extractedContent = extractEmailContent({
          accountEmail: email,
          messageId: msg.id,
          payload: msg.payload,
        });
        const preview = getPreview(extractedContent);

        return {
          id: msg.id,
          accountEmail: email,
          from,
          subject,
          preview,
          body: extractedContent.textBody,
          bodyHtml: extractedContent.htmlBody,
          date: new Date(parseInt(msg.internalDate)).toLocaleString(),
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
 * Extract plain text, HTML, and inline-image metadata from a Gmail payload.
 */
function extractEmailContent({
  accountEmail,
  messageId,
  payload,
}: {
  accountEmail: string;
  messageId: string;
  payload?: GmailPart;
}): ExtractedEmailContent {
  if (!payload) {
    return {
      htmlBody: "",
      inlineAttachments: [],
      textBody: "",
    };
  }

  const textParts: string[] = [];
  const htmlParts: string[] = [];
  const inlineAttachments: InlineAttachment[] = [];

  const visitPart = (part?: GmailPart) => {
    if (!part) {
      return;
    }

    const decodedBody = decodeBody(part.body?.data);
    if (part.mimeType === "text/plain" && decodedBody.trim()) {
      textParts.push(decodedBody);
    }

    if (part.mimeType === "text/html" && decodedBody.trim()) {
      htmlParts.push(decodedBody);
    }

    const cid = getHeaderValue(part.headers, "Content-ID");
    if (cid && part.body?.attachmentId && part.mimeType?.startsWith("image/")) {
      inlineAttachments.push({
        attachmentId: part.body.attachmentId,
        cid: cid.replace(/[<>]/g, "").trim(),
        mimeType: part.mimeType,
      });
    }

    part.parts?.forEach(visitPart);
  };

  visitPart(payload);

  const fallbackBody = decodeBody(payload.body?.data);
  const textBody = textParts.join("\n\n").trim() || stripHtml(htmlParts.join("\n\n")).trim() || stripHtml(fallbackBody).trim();
  const rawHtml = htmlParts.join("\n\n").trim() || (looksLikeHtml(fallbackBody) ? fallbackBody : "");

  return {
    htmlBody: sanitizeEmailHtml(rawHtml, inlineAttachments, {
      accountEmail,
      messageId,
    }),
    inlineAttachments,
    textBody,
  };
}

function getPreview(content: ExtractedEmailContent): string {
  if (content.textBody) {
    return content.textBody.substring(0, 200);
  }

  return stripHtml(content.htmlBody).substring(0, 200);
}

function decodeBody(data?: string): string {
  if (!data) {
    return "";
  }

  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function getHeaderValue(headers: GmailHeader[] = [], name: string): string {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeEmailHtml(
  html: string,
  inlineAttachments: InlineAttachment[],
  context: {
    accountEmail: string;
    messageId: string;
  },
): string {
  if (!html) {
    return "";
  }

  const inlineMap = new Map(
    inlineAttachments.map((attachment) => [attachment.cid.toLowerCase(), attachment]),
  );

  const rewrittenHtml = html.replace(/src=(['"])cid:([^'"]+)\1/gi, (_match, quote, cid) => {
    const normalizedCid = String(cid).trim().replace(/[<>]/g, "").toLowerCase();
    const attachment = inlineMap.get(normalizedCid);

    if (!attachment) {
      return `src=${quote}${""}${quote}`;
    }

    return `src=${quote}${buildInlineImageUrl({
      accountEmail: context.accountEmail,
      attachmentId: attachment.attachmentId,
      mimeType: attachment.mimeType,
      messageId: context.messageId,
    })}${quote}`;
  });

  return basicSanitizeHtml(rewrittenHtml);
}

function basicSanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|meta|link|base)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|meta|link|base)[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s+src\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, ' src=""')
    .replace(/\s+href\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, ' href="#"')
    .replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
      const safeAttrs = attrs
        .replace(/\s+target\s*=\s*(["']).*?\1/gi, "")
        .replace(/\s+rel\s*=\s*(["']).*?\1/gi, "");

      return `<a${safeAttrs} target="_blank" rel="noopener noreferrer">`;
    });
}

function buildInlineImageUrl({
  accountEmail,
  attachmentId,
  mimeType,
  messageId,
}: {
  accountEmail: string;
  attachmentId: string;
  mimeType: string;
  messageId: string;
}): string {
  const params = new URLSearchParams({
    attachmentId,
    email: accountEmail,
    messageId,
    mimeType,
  });

  return `/api/gmail/attachments?${params.toString()}`;
}
