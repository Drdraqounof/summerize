-- CreateTable Contact
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "displayName" TEXT,
    "firstEmailAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEmailAt" TIMESTAMP(3) NOT NULL,
    "emailCount" INTEGER NOT NULL DEFAULT 1,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER,
    "lastSentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey Contact
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex Contact
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_userId_senderEmail_idx" ON "Contact"("userId", "senderEmail");
CREATE UNIQUE INDEX "Contact_userId_senderEmail_key" ON "Contact"("userId", "senderEmail");

-- AlterTable Email: Add threadId and actionItems
ALTER TABLE "Email" ADD COLUMN "threadId" TEXT;
ALTER TABLE "Email" ADD COLUMN "actionItems" JSONB;

-- CreateIndex Email
CREATE INDEX "Email_userId_threadId_idx" ON "Email"("userId", "threadId");
