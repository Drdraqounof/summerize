import { NextRequest, NextResponse } from "next/server";
import {
  isMissingEmailNotificationColumnError,
  supportsEmailNotificationPersistence,
} from "@/lib/email-schema";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/tokenStore";
import { syncGmailLabel, type SyncLabel } from "@/lib/gmail-sync";

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

const validLabels: SyncLabel[] = ["inbox", "spam", "promotions", "updates", "trash"];

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const userEmail = request.nextUrl.searchParams.get("userEmail")?.trim().toLowerCase();
    const label = (request.nextUrl.searchParams.get("label") || "inbox") as SyncLabel;
    const sinceParam = request.nextUrl.searchParams.get("since");
    const maxResultsParam = request.nextUrl.searchParams.get("maxResults");

    if (!validLabels.includes(label)) {
      return NextResponse.json(
        { error: "Invalid label. Allowed: inbox, spam, promotions, updates, trash" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = userEmail
      ? await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        })
      : null;

    const accessToken = getToken(email);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found for this email. Please reconnect." },
        { status: 401 }
      );
    }

    // When since is provided, use paginated sync for date-range fetching
    if (sinceParam) {
      const since = new Date(sinceParam);
      const maxResults = maxResultsParam ? parseInt(maxResultsParam, 10) : 500;

      if (user) {
        const result = await syncGmailLabel(accessToken, email, user.id, label, since, maxResults);

        // Return the synced emails from the database
        const dbEmails = await prisma.email.findMany({
          where: { userId: user.id, gmailLabel: label, receivedAt: { gte: since } },
          orderBy: { receivedAt: "desc" },
          take: maxResults,
          select: {
            gmailId: true,
            from: true,
            subject: true,
            preview: true,
            body: true,
            receivedAt: true,
            summary: true,
            analyzedAt: true,
            gmailLabel: true,
            category: { select: { category: true } },
          },
        });

        return NextResponse.json({
          emails: dbEmails.map((e: { gmailId: string | null; from: string; subject: string; preview: string | null; body: string | null; receivedAt: Date; summary: string | null; analyzedAt: Date | null; gmailLabel: string; category: { category: string } | null }) => ({
            id: e.gmailId,
            accountEmail: email,
            from: e.from,
            subject: e.subject,
            preview: e.preview,
            date: e.receivedAt.toISOString(),
            category: e.category?.category,
            summary: e.summary ?? undefined,
            analyzed: Boolean(e.analyzedAt),
            gmailLabel: e.gmailLabel,
          })),
          total: dbEmails.length,
          truncated: result.truncated,
        });
      }

      return NextResponse.json({ emails: [], total: 0 });
    }

    // Legacy 20-message fetch (keep existing behavior)
    const labelQuery = (() => {
      switch (label) {
        case "spam": return "is:spam";
        case "trash": return "in:trash";
        case "promotions": return "category:promotions";
        case "updates": return "category:updates";
        default: return "in:inbox";
      }
    })();

    const messagesResponse = await fetch(`${GMAIL_API_URL}/messages?maxResults=20&q=${encodeURIComponent(labelQuery)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
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
      return NextResponse.json({ emails: [], total: 0 });
    }

    const emailPromises = messagesData.messages.map((msg) =>
      fetch(`${GMAIL_API_URL}/messages/${msg.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error("[Gmail API] Failed to fetch message:", msg.id, err);
          return null;
        })
    );

    const messageDetails = await Promise.all(emailPromises);

    const transformedEmails = messageDetails
      .filter((msg): msg is GmailMessage => msg !== null)
      .map((msg) => {
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((header) => header.name === name)?.value || "";

        const subject = getHeader("Subject") || "(No Subject)";
        const from = formatSender(getHeader("From"));
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
          to: getHeader("To") || email,
          cc: getHeader("Cc") || null,
          preview,
          body: extractedContent.textBody,
          bodyHtml: extractedContent.htmlBody,
          receivedAt: new Date(parseInt(msg.internalDate)),
          gmailLabel: label,
        };
      });

    const supportsNotificationPersistence = user
      ? await supportsEmailNotificationPersistence()
      : false;

    const emails = user
      ? await Promise.all(
          transformedEmails.map(async (emailRecord) => {
            try {
              const persisted = await prisma.email.upsert({
                where: { gmailId: emailRecord.id },
                update: {
                  subject: emailRecord.subject,
                  from: emailRecord.from,
                  to: emailRecord.to,
                  cc: emailRecord.cc,
                  preview: emailRecord.preview,
                  body: emailRecord.body,
                  receivedAt: emailRecord.receivedAt,
                  userId: user.id,
                  gmailLabel: emailRecord.gmailLabel,
                },
                create: {
                  userId: user.id,
                  gmailId: emailRecord.id,
                  subject: emailRecord.subject,
                  from: emailRecord.from,
                  to: emailRecord.to,
                  cc: emailRecord.cc,
                  preview: emailRecord.preview,
                  body: emailRecord.body,
                  receivedAt: emailRecord.receivedAt,
                  gmailLabel: emailRecord.gmailLabel,
                },
                select: {
                  from: true,
                  subject: true,
                  preview: true,
                  body: true,
                  receivedAt: true,
                  summary: true,
                  analyzedAt: true,
                  ...(supportsNotificationPersistence
                    ? { shouldNotify: true, matchReason: true }
                    : {}),
                  category: {
                    select: { category: true },
                  },
                },
              });

              return {
                id: emailRecord.id,
                accountEmail: email,
                from: persisted.from,
                subject: persisted.subject,
                preview: persisted.preview ?? emailRecord.preview,
                body: persisted.body ?? emailRecord.body,
                bodyHtml: emailRecord.bodyHtml,
                date: persisted.receivedAt.toISOString(),
                category: persisted.category?.category,
                summary: persisted.summary ?? undefined,
                analyzed: Boolean(persisted.analyzedAt),
                gmailLabel: emailRecord.gmailLabel,
                shouldNotify: supportsNotificationPersistence
                  ? (persisted as { shouldNotify: boolean }).shouldNotify
                  : undefined,
                matchReason: supportsNotificationPersistence
                  ? (persisted as { matchReason: string | null }).matchReason ?? undefined
                  : undefined,
              };
            } catch (error) {
              if (isMissingEmailNotificationColumnError(error)) {
                console.warn("[Gmail API] Skipping notification field persistence until Prisma schema is applied.");
                return {
                  id: emailRecord.id,
                  accountEmail: email,
                  from: emailRecord.from,
                  subject: emailRecord.subject,
                  preview: emailRecord.preview,
                  body: emailRecord.body,
                  bodyHtml: emailRecord.bodyHtml,
                  date: emailRecord.receivedAt?.toISOString() ?? new Date(0).toISOString(),
                  gmailLabel: emailRecord.gmailLabel,
                  analyzed: false,
                };
              }
              throw error;
            }
          })
        )
      : transformedEmails.map((emailRecord) => ({
          id: emailRecord.id,
          accountEmail: email,
          from: emailRecord.from,
          subject: emailRecord.subject,
          preview: emailRecord.preview,
          body: emailRecord.body,
          bodyHtml: emailRecord.bodyHtml,
          date: emailRecord.receivedAt.toISOString(),
          gmailLabel: emailRecord.gmailLabel,
          analyzed: false,
        }));

    console.log("[Gmail API] Successfully fetched", emails.length, "emails for", email);
    return NextResponse.json({ emails, total: messagesData.resultSizeEstimate || emails.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Gmail API] Fetch error:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to fetch emails: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Inline utility functions (kept to maintain backward compatibility)
// ---------------------------------------------------------------------------

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
    return { htmlBody: "", inlineAttachments: [], textBody: "" };
  }
  const textParts: string[] = [];
  const htmlParts: string[] = [];
  const inlineAttachments: InlineAttachment[] = [];
  const visitPart = (part?: GmailPart) => {
    if (!part) return;
    const decodedBody = decodeBody(part.body?.data);
    if (part.mimeType === "text/plain" && decodedBody.trim()) textParts.push(decodedBody);
    if (part.mimeType === "text/html" && decodedBody.trim()) htmlParts.push(decodedBody);
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
    htmlBody: sanitizeEmailHtml(rawHtml, inlineAttachments, { accountEmail, messageId }),
    inlineAttachments,
    textBody,
  };
}

function getPreview(content: ExtractedEmailContent): string {
  if (content.textBody) return content.textBody.substring(0, 200);
  return stripHtml(content.htmlBody).substring(0, 200);
}

function decodeBody(data?: string): string {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function getHeaderValue(headers: GmailHeader[] = [], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function formatSender(fromHeader: string): string {
  const normalized = fromHeader.replace(/\s+/g, " ").trim();
  if (!normalized) return "Unknown";
  const senderMatch = normalized.match(/^(?:"?([^"<]+?)"?\s*)?<([^>]+)>$/);
  if (!senderMatch) return normalized.replace(/^<|>$/g, "").replace(/^"+|"+$/g, "").trim();
  const displayName = senderMatch[1]?.trim().replace(/^"+|"+$/g, "");
  const email = senderMatch[2]?.trim();
  if (displayName && displayName.toLowerCase() !== email.toLowerCase()) return displayName;
  return email;
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
  context: { accountEmail: string; messageId: string },
): string {
  if (!html) return "";
  const inlineMap = new Map(inlineAttachments.map((a) => [a.cid.toLowerCase(), a]));
  const rewrittenHtml = html.replace(/src=(['"])cid:([^'"]+)\1/gi, (_match, quote, cid) => {
    const normalizedCid = String(cid).trim().replace(/[<>]/g, "").toLowerCase();
    const attachment = inlineMap.get(normalizedCid);
    if (!attachment) return `src=${quote}${""}${quote}`;
    return `src=${quote}${buildInlineImageUrl({ accountEmail: context.accountEmail, attachmentId: attachment.attachmentId, mimeType: attachment.mimeType, messageId: context.messageId })}${quote}`;
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
      const safeAttrs = attrs.replace(/\s+target\s*=\s*(["']).*?\1/gi, "").replace(/\s+rel\s*=\s*(["']).*?\1/gi, "");
      return `<a${safeAttrs} target="_blank" rel="noopener noreferrer">`;
    });
}

function buildInlineImageUrl({ accountEmail, attachmentId, mimeType, messageId }: { accountEmail: string; attachmentId: string; mimeType: string; messageId: string }): string {
  const params = new URLSearchParams({ attachmentId, email: accountEmail, messageId, mimeType });
  return `/api/gmail/attachments?${params.toString()}`;
}
