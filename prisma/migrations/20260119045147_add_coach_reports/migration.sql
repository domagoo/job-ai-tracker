/*
  Warnings:

  - You are about to drop the column `followUpEmailBody` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `followUpEmailSubject` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "followUpEmailBody",
DROP COLUMN "followUpEmailSubject";

-- CreateTable
CREATE TABLE "CoachReport" (
    "id" SERIAL NOT NULL,
    "rangeDays" INTEGER NOT NULL DEFAULT 14,
    "totalApplications" INTEGER NOT NULL,
    "byStatus" JSONB NOT NULL,
    "dailyCreated" JSONB NOT NULL,
    "avgDaysInPipeline" DOUBLE PRECISION NOT NULL,
    "funnel" JSONB NOT NULL,
    "avgTimePerStage" JSONB NOT NULL,
    "reachedCount" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priorities" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachReport_createdAt_idx" ON "CoachReport"("createdAt");
