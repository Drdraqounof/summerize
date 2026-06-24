import { prisma } from "./prisma";
import { supportsEmailNotificationPersistence } from "./email-schema";
import { emailMatchesAnyRule, type RuleConditions, type EmailForMatching } from "./rule-engine";

const GMAIL_API_URL = "https://www.googleapis.com/gmail/v1/users/me";

export type SyncLabel = "inbox" | "spam" | "promotions" | "updates" | "trash";

export interface SyncResult {
  synced: number;
  truncated: boolean;
}

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
  threadId: string;
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

function basicSanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|meta|link|base)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|meta|link|base)[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s+src\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, ' src=""')
    .replace(/\s+href\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, ' href="#"')
    .replace(/<a\b([^>]*)>/gi, (_match: string, attrs: string) => {
      const safeAttrs = attrs
        .replace(/\s+target\s*=\s*(["']).*?\1/gi, "")
        .replace(/\s+rel\s*=\s*(["']).*?\1/gi, "");
      return `<a${safeAttrs} target="_blank" rel="noopener noreferrer">`;
    });
}

function buildInlineImageUrl(accountEmail: string, messageId: string, attachmentId: string, mimeType: string): string {
  const params = new URLSearchParams({ attachmentId, email: accountEmail, messageId, mimeType });
  return `/api/gmail/attachments?${params.toString()}`;
}

function sanitizeEmailHtml(html: string, inlineAttachments: InlineAttachment[], accountEmail: string, messageId: string): string {
  if (!html) return "";
  const inlineMap = new Map(inlineAttachments.map((a) => [a.cid.toLowerCase(), a]));
  const rewrittenHtml = html.replace(/src=(['"])cid:([^'"]+)\1/gi, (_match, quote, cid) => {
    const normalizedCid = String(cid).trim().replace(/[<>]/g, "").toLowerCase();
    const attachment = inlineMap.get(normalizedCid);
    if (!attachment) return `src=${quote}${""}${quote}`;
    return `src=${quote}${buildInlineImageUrl(accountEmail, messageId, attachment.attachmentId, attachment.mimeType)}${quote}`;
  });
  return basicSanitizeHtml(rewrittenHtml);
}

function extractEmailContent(accountEmail: string, messageId: string, payload?: GmailPart): ExtractedEmailContent {
  if (!payload) return { htmlBody: "", inlineAttachments: [], textBody: "" };
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
      inlineAttachments.push({ attachmentId: part.body.attachmentId, cid: cid.replace(/[<>]/g, "").trim(), mimeType: part.mimeType });
    }
    part.parts?.forEach(visitPart);
  };
  visitPart(payload);
  const fallbackBody = decodeBody(payload.body?.data);
  const textBody = textParts.join("\n\n").trim() || stripHtml(htmlParts.join("\n\n")).trim() || stripHtml(fallbackBody).trim();
  const rawHtml = htmlParts.join("\n\n").trim() || (looksLikeHtml(fallbackBody) ? fallbackBody : "");
  return {
    htmlBody: sanitizeEmailHtml(rawHtml, inlineAttachments, accountEmail, messageId),
    inlineAttachments,
    textBody,
  };
}

function getPreview(content: ExtractedEmailContent): string {
  if (content.textBody) return content.textBody.substring(0, 200);
  return stripHtml(content.htmlBody).substring(0, 200);
}

function getLabelQuery(label: SyncLabel): string {
  switch (label) {
    case "spam": return "is:spam";
    case "trash": return "in:trash";
    case "promotions": return "category:promotions";
    case "updates": return "category:updates";
    default: return "in:inbox";
  }
}

export async function syncGmailLabel(
  accessToken: string,
  userEmail: string,
  userId: string,
  label: SyncLabel,
  since?: Date,
  maxResults: number = 500,
  rules?: Array<{ conditions: RuleConditions }>
): Promise<SyncResult> {
  let synced = 0;
  let truncated = false;
  let pageToken: string | undefined;

  const baseQuery = getLabelQuery(label);
  const dateQuery = since
    ? `after:${since.getFullYear()}/${String(since.getMonth() + 1).padStart(2, "0")}/${String(since.getDate()).padStart(2, "0")}`
    : "";
  const fullQuery = dateQuery ? `${dateQuery} ${baseQuery}` : baseQuery;

  const supportsNotifications = await supportsEmailNotificationPersistence();

  do {
    const params = new URLSearchParams({ q: fullQuery, maxResults: String(Math.min(100, maxResults - synced)) });
    if (pageToken) params.set("pageToken", pageToken);

    const listRes = await fetch(`${GMAIL_API_URL}/messages?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!listRes.ok) {
      if (listRes.status === 401) throw new Error("Access token expired. Please reconnect.");
      const errorText = await listRes.text();
      throw new Error(`Gmail API error (${listRes.status}): ${errorText}`);
    }

    const listData = await listRes.json() as {
      messages?: Array<{ id: string; threadId: string }>;
      nextPageToken?: string;
    };

    if (!listData.messages?.length) break;

    const details = await Promise.all(
      listData.messages.map((msg) =>
        fetch(`${GMAIL_API_URL}/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }).then((r) => r.json() as Promise<GmailMessage>).catch(() => null)
      )
    );

    for (const msg of details.filter((m): m is GmailMessage => m !== null)) {
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name === name)?.value || "";
      const extracted = extractEmailContent(userEmail, msg.id, msg.payload);

      const record = {
        gmailId: msg.id,
        threadId: msg.threadId,
        userId,
        subject: getHeader("Subject") || "(No Subject)",
        from: formatSender(getHeader("From")),
        to: getHeader("To") || userEmail,
        cc: getHeader("Cc") || null,
        preview: getPreview(extracted),
        body: extracted.textBody,
        receivedAt: msg.internalDate ? new Date(parseInt(msg.internalDate)) : new Date(),
        gmailLabel: label,
      };

      // Skip emails that don't match any active rule
      if (rules && rules.length > 0) {
        const emailForMatching: EmailForMatching = {
          from: record.from,
          subject: record.subject,
          body: record.body,
          preview: record.preview,
        };
        if (!emailMatchesAnyRule(emailForMatching, rules)) {
          continue;
        }
      }

      try {
        await prisma.email.upsert({
          where: { gmailId: record.gmailId },
          update: {
            subject: record.subject,
            from: record.from,
            to: record.to,
            cc: record.cc,
            preview: record.preview,
            body: record.body,
            receivedAt: record.receivedAt,
            userId: record.userId,
            gmailLabel: record.gmailLabel,
            threadId: record.threadId,
          },
          create: record,
          select: { id: true },
        });
        synced++;
      } catch (error) {
        if (error instanceof Error && error.message.includes("column `")) {
          console.warn("[Gmail Sync] Skipping due to schema mismatch:", error.message);
        } else {
          throw error;
        }
      }
    }

    pageToken = listData.nextPageToken;
    if (synced >= maxResults) {
      truncated = true;
      break;
    }
  } while (pageToken);

  console.log(`[Gmail Sync] Synced ${synced} ${label} emails${truncated ? " (truncated)" : ""}`);
  return { synced, truncated };
}
