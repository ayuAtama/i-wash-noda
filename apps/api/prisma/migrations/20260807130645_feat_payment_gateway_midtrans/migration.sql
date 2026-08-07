/*
  Warnings:

  - You are about to drop the column `amount` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `payment_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "amount",
DROP COLUMN "status",
ADD COLUMN     "acquirer" TEXT,
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "fraud_status" TEXT,
ADD COLUMN     "gross_amount" INTEGER,
ADD COLUMN     "issuer" TEXT,
ADD COLUMN     "payment_type" TEXT,
ADD COLUMN     "settlement_time" TIMESTAMP(3),
ADD COLUMN     "status_code" TEXT,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "transaction_status" TEXT,
ADD COLUMN     "transaction_time" TIMESTAMP(3),
ADD COLUMN     "va_number" TEXT;
