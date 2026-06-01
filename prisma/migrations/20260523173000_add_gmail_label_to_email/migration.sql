ALTER TABLE "Email"
ADD COLUMN "gmailLabel" TEXT DEFAULT 'inbox';

CREATE INDEX "Email_gmailLabel_idx" ON "Email"("gmailLabel");