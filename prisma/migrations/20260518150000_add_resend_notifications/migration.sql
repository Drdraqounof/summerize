ALTER TABLE "UserPreference"
ADD COLUMN "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastDigestSentAt" TIMESTAMP(3);

ALTER TABLE "Email"
ADD COLUMN "shouldNotify" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "matchReason" TEXT;