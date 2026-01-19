/*
  Warnings:

  - The values [STATUS_CHANGE] on the enum `ApplicationEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationEventType_new" AS ENUM ('CREATED', 'UPDATED', 'REORDERED');
ALTER TABLE "public"."ApplicationEvent" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "ApplicationEvent" ALTER COLUMN "type" TYPE "ApplicationEventType_new" USING ("type"::text::"ApplicationEventType_new");
ALTER TYPE "ApplicationEventType" RENAME TO "ApplicationEventType_old";
ALTER TYPE "ApplicationEventType_new" RENAME TO "ApplicationEventType";
DROP TYPE "public"."ApplicationEventType_old";
ALTER TABLE "ApplicationEvent" ALTER COLUMN "type" SET DEFAULT 'UPDATED';
COMMIT;

-- AlterTable
ALTER TABLE "ApplicationEvent" ADD COLUMN     "fromOrder" INTEGER,
ADD COLUMN     "toOrder" INTEGER,
ALTER COLUMN "type" SET DEFAULT 'UPDATED';
