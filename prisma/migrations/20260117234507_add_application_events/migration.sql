/*
  Warnings:

  - You are about to drop the column `appliedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `interviewAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `offerAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `statusUpdatedAt` on the `Application` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('CREATED', 'STATUS_CHANGE', 'REORDERED');

-- DropIndex
DROP INDEX "Application_statusUpdatedAt_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "appliedAt",
DROP COLUMN "interviewAt",
DROP COLUMN "offerAt",
DROP COLUMN "rejectedAt",
DROP COLUMN "statusUpdatedAt";

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "type" "ApplicationEventType" NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_type_createdAt_idx" ON "ApplicationEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
