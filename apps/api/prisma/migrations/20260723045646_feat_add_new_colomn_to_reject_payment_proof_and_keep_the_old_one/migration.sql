/*
  Warnings:

  - Added the required column `updated_at` to the `payment_proof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_proof" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
