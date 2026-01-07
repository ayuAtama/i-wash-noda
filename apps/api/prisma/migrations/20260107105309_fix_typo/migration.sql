/*
  Warnings:

  - You are about to drop the column `orderId` on the `driver_job_status` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "driver_job_status" DROP CONSTRAINT "driver_job_status_orderId_fkey";

-- AlterTable
ALTER TABLE "driver_job_status" DROP COLUMN "orderId";
