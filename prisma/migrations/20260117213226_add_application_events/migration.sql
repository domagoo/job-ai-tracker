/*
  Warnings:

  - You are about to drop the column `fromOrder` on the `ApplicationEvent` table. All the data in the column will be lost.
  - You are about to drop the column `toOrder` on the `ApplicationEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicationEvent" DROP COLUMN "fromOrder",
DROP COLUMN "toOrder",
ALTER COLUMN "type" DROP DEFAULT;
