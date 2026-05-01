/*
  Warnings:

  - You are about to drop the `ClassificationFeedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassificationFeedback" DROP CONSTRAINT "ClassificationFeedback_emailId_fkey";

-- DropForeignKey
ALTER TABLE "ClassificationFeedback" DROP CONSTRAINT "ClassificationFeedback_userId_fkey";

-- DropTable
DROP TABLE "ClassificationFeedback";
