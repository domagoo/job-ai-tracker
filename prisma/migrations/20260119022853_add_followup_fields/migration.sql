/*
  Warnings:

  - You are about to drop the column `followUpEmail` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "followUpEmail",
ADD COLUMN     "followUpEmailBody" TEXT,
ADD COLUMN     "followUpEmailSubject" TEXT;
