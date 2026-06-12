import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const CADENCE_WINDOWS = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
} as const;

export type NotificationFrequency = keyof typeof CADENCE_WINDOWS;

export interface NotificationSettingsRecord {
  notificationEnabled: boolean;
  notificationFrequency: NotificationFrequency | null;
  lastDigestSentAt: string | null;
}

interface DigestEmailRecord {
  analyzedAt: Date | null;
  from: string;
  matchReason: string | null;
  preview: string | null;
  subject: string;
  summary: string | null;
  category: {
    category: string;
  } | null;
}

interface DigestPayload {
  frequency: NotificationFrequency;
  generatedAt: Date;
  items: Array<{
    category?: string;
    from: string;
    matchReason: string;
    subject: string;
    summary: string;
  }>;
  recipientEmail: string;
  recipientName: string;
}

interface SendDigestResult {
  itemCount: number;
  message: string;
  sent: boolean;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function getSenderEmail() {
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim();

  if (!fromAddress) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return `Mail Turtle <${fromAddress}>`;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();
  await resend.emails.send({
    from: getSenderEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export function normalizeNotificationFrequency(value?: string | null): NotificationFrequency | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "hourly" || normalized === "daily" || normalized === "weekly") {
    return normalized;
  }

  return null;
}

function getCadenceWindowMs(frequency: NotificationFrequency) {
  return CADENCE_WINDOWS[frequency];
}

function formatNotificationSettings(settings: {
  lastDigestSentAt: Date | null;
  notificationEnabled: boolean;
  notificationFrequency: string | null;
}): NotificationSettingsRecord {
  return {
    notificationEnabled: settings.notificationEnabled,
    notificationFrequency: normalizeNotificationFrequency(settings.notificationFrequency),
    lastDigestSentAt: settings.lastDigestSentAt?.toISOString() ?? null,
  };
}

function getDigestStartDate(lastDigestSentAt: Date | null, frequency: NotificationFrequency) {
  if (lastDigestSentAt) {
    return lastDigestSentAt;
  }

  return new Date(Date.now() - getCadenceWindowMs(frequency));
}

function isDigestDue(lastDigestSentAt: Date | null, frequency: NotificationFrequency) {
  if (!lastDigestSentAt) {
    return true;
  }

  return Date.now() - lastDigestSentAt.getTime() >= getCadenceWindowMs(frequency);
}

function renderDigestHtml(payload: DigestPayload) {
  const itemsMarkup = payload.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 0 0 18px;">
            <div style="border: 1px solid #d8f1d6; border-radius: 18px; padding: 18px; background: #f7fff4;">
              <p style="margin: 0 0 6px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #2f7a3b; font-weight: 700;">
                ${item.category || "Watchlist match"}
              </p>
              <h3 style="margin: 0; font-size: 18px; color: #162018;">${escapeHtml(item.subject)}</h3>
              <p style="margin: 8px 0 0; color: #4a5a4d; font-size: 14px;">From ${escapeHtml(item.from)}</p>
              <p style="margin: 12px 0 0; color: #233126; font-size: 14px; line-height: 1.6;">${escapeHtml(item.summary)}</p>
              <p style="margin: 10px 0 0; color: #2f7a3b; font-size: 13px; line-height: 1.5; font-weight: 600;">${escapeHtml(item.matchReason)}</p>
            </div>
          </td>
        </tr>`,
    )
    .join("");

  return `
    <html>
      <body style="margin: 0; padding: 24px; background: #edfbe7; font-family: Arial, Helvetica, sans-serif; color: #162018;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 28px; padding: 32px; border: 1px solid #d8f1d6;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #2f7a3b; font-weight: 700;">MailTurtle digest</p>
              <h1 style="margin: 14px 0 0; font-size: 30px; line-height: 1.15;">${payload.items.length} watchlist match${payload.items.length === 1 ? "" : "es"} in your ${payload.frequency} digest</h1>
              <p style="margin: 16px 0 24px; font-size: 15px; line-height: 1.7; color: #4a5a4d;">Hi ${escapeHtml(payload.recipientName)}, here are the emails MailTurtle flagged since your last digest.</p>
            </td>
          </tr>
          ${itemsMarkup}
          <tr>
            <td style="padding-top: 10px; font-size: 12px; color: #657468; line-height: 1.6;">
              Generated ${payload.generatedAt.toLocaleString()}.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mapDigestItems(emails: DigestEmailRecord[]) {
  return emails.map((email) => ({
    category: email.category?.category,
    from: email.from,
    matchReason: email.matchReason || "This email matched your watchlist.",
    subject: email.subject,
    summary: email.summary || email.preview || "MailTurtle identified this email as worth your attention.",
  }));
}

export async function getNotificationSettings(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      preferences: {
        select: {
          lastDigestSentAt: true,
          notificationEnabled: true,
          notificationFrequency: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return formatNotificationSettings(
    user.preferences ?? {
      lastDigestSentAt: null,
      notificationEnabled: true,
      notificationFrequency: null,
    },
  );
}

export async function updateNotificationSettings(input: {
  email: string;
  notificationEnabled?: boolean;
  notificationFrequency?: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const frequency = input.notificationFrequency === undefined
    ? undefined
    : normalizeNotificationFrequency(input.notificationFrequency);

  if (input.notificationFrequency !== undefined && !frequency) {
    throw new Error("Notification frequency must be hourly, daily, or weekly.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      preferences: {
        upsert: {
          create: {
            notificationEnabled: input.notificationEnabled ?? true,
            notificationFrequency: frequency ?? null,
          },
          update: {
            ...(input.notificationEnabled === undefined ? {} : { notificationEnabled: input.notificationEnabled }),
            ...(frequency === undefined ? {} : { notificationFrequency: frequency }),
          },
        },
      },
    },
    select: {
      preferences: {
        select: {
          lastDigestSentAt: true,
          notificationEnabled: true,
          notificationFrequency: true,
        },
      },
    },
  });

  return formatNotificationSettings(
    updatedUser.preferences ?? {
      lastDigestSentAt: null,
      notificationEnabled: true,
      notificationFrequency: null,
    },
  );
}

async function buildDigestPayloadForUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      email: true,
      id: true,
      name: true,
      preferences: {
        select: {
          lastDigestSentAt: true,
          notificationEnabled: true,
          notificationFrequency: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const frequency = normalizeNotificationFrequency(user.preferences?.notificationFrequency);

  if (!user.preferences?.notificationEnabled) {
    return { payload: null, reason: "Notifications are disabled.", userId: user.id };
  }

  if (!frequency) {
    return { payload: null, reason: "Notification frequency is not set.", userId: user.id };
  }

  if (!isDigestDue(user.preferences.lastDigestSentAt, frequency)) {
    return { payload: null, reason: "Digest is not due yet.", userId: user.id };
  }

  const digestStartDate = getDigestStartDate(user.preferences.lastDigestSentAt, frequency);
  const emails = await prisma.email.findMany({
    where: {
      userId: user.id,
      shouldNotify: true,
      analyzedAt: {
        gte: digestStartDate,
      },
    },
    select: {
      analyzedAt: true,
      from: true,
      matchReason: true,
      preview: true,
      subject: true,
      summary: true,
      category: {
        select: {
          category: true,
        },
      },
    },
    orderBy: {
      analyzedAt: "desc",
    },
    take: 12,
  });

  if (emails.length === 0) {
    return { payload: null, reason: "No matched emails are ready for this digest window.", userId: user.id };
  }

  return {
    payload: {
      frequency,
      generatedAt: new Date(),
      items: mapDigestItems(emails),
      recipientEmail: user.email,
      recipientName: user.name?.trim() || user.email.split("@")[0],
    },
    reason: null,
    userId: user.id,
  };
}

export async function sendDigestForUser(email: string): Promise<SendDigestResult> {
  const { payload, reason, userId } = await buildDigestPayloadForUser(email);

  if (!payload || !userId) {
    return {
      itemCount: 0,
      message: reason || "No digest payload was generated.",
      sent: false,
    };
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getSenderEmail(),
    html: renderDigestHtml(payload),
    subject: `MailTurtle ${payload.frequency} digest: ${payload.items.length} watchlist match${payload.items.length === 1 ? "" : "es"}`,
    to: payload.recipientEmail,
  });

  await prisma.userPreference.update({
    where: { userId },
    data: { lastDigestSentAt: new Date() },
  });

  return {
    itemCount: payload.items.length,
    message: `Digest sent to ${payload.recipientEmail}.`,
    sent: true,
  };
}

export async function sendDueDigests() {
  const users = await prisma.user.findMany({
    where: {
      preferences: {
        is: {
          notificationEnabled: true,
          notificationFrequency: {
            not: null,
          },
        },
      },
    },
    select: {
      email: true,
    },
  });

  const results = await Promise.all(
    users.map(async (user: { email: string }) => ({
      email: user.email,
      result: await sendDigestForUser(user.email),
    })),
  );

  return results;
}