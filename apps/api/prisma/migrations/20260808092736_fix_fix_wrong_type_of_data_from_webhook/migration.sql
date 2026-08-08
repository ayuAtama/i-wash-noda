/*
  Warnings:

  - You are about to drop the column `va_number` on the `payment_gateway_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment_gateway_transactions" DROP COLUMN "va_number",
ALTER COLUMN "gross_amount" SET DATA TYPE TEXT;
