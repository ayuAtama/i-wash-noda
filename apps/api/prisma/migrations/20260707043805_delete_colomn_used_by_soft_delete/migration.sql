/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `worker_shifts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "worker_shifts" DROP COLUMN "is_deleted";
