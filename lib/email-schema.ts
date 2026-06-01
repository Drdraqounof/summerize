import { prisma } from "@/lib/prisma";

let emailNotificationColumnsPromise: Promise<boolean> | undefined;

export async function supportsEmailNotificationPersistence() {
  if (!emailNotificationColumnsPromise) {
    emailNotificationColumnsPromise = (async () => {
      try {
        const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Email'
            AND column_name IN ('shouldNotify', 'matchReason')
        `;

        return columns.length === 2;
      } catch (error) {
        console.warn("[Prisma] Could not inspect Email notification columns:", error);
        return false;
      }
    })();
  }

  return emailNotificationColumnsPromise;
}

export function isMissingEmailNotificationColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Email.shouldNotify") ||
    message.includes("column `shouldNotify") ||
    message.includes("Unknown argument `shouldNotify`") ||
    message.includes("Email.matchReason") ||
    message.includes("column `matchReason") ||
    message.includes("Unknown argument `matchReason`")
  );
}