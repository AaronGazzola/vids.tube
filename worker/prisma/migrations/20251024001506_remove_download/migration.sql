/*
  Warnings:

  - You are about to drop the column `error` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "error",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."VideoStatus";
