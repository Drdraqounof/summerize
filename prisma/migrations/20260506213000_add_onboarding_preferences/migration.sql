ALTER TABLE "UserPreference"
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasUsedAiBefore" TEXT,
ADD COLUMN "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "assistantStyle" TEXT,
ADD COLUMN "notificationFrequency" TEXT;