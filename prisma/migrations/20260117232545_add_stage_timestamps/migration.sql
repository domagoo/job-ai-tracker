/*
  Warnings:

  - You are about to drop the `ApplicationEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApplicationEvent" DROP CONSTRAINT "ApplicationEvent_applicationId_fkey";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "interviewAt" TIMESTAMP(3),
ADD COLUMN     "offerAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "ApplicationEvent";

-- DropEnum
DROP TYPE "ApplicationEventType";

-- CreateIndex
CREATE INDEX "Application_statusUpdatedAt_idx" ON "Application"("statusUpdatedAt");
