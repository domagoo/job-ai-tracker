/*
  Warnings:

  - Made the column `avgDaysInPipeline` on table `CoachReport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reachedCount` on table `CoachReport` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CoachReport" ALTER COLUMN "avgDaysInPipeline" SET NOT NULL,
ALTER COLUMN "reachedCount" SET NOT NULL;
