/*
  Warnings:

  - You are about to drop the column `risks` on the `CoachReport` table. All the data in the column will be lost.
  - You are about to drop the column `suggestions` on the `CoachReport` table. All the data in the column will be lost.
  - The `reachedCount` column on the `CoachReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "followUpEmailBody" TEXT,
ADD COLUMN     "followUpEmailSubject" TEXT;

-- AlterTable
ALTER TABLE "CoachReport" DROP COLUMN "risks",
DROP COLUMN "suggestions",
ALTER COLUMN "rangeDays" DROP DEFAULT,
ALTER COLUMN "avgDaysInPipeline" DROP NOT NULL,
DROP COLUMN "reachedCount",
ADD COLUMN     "reachedCount" INTEGER;
