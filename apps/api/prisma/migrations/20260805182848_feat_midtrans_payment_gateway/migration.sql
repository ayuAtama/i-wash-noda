-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "fraud_status" TEXT,
ADD COLUMN     "payment_type" TEXT,
ADD COLUMN     "provider_order_id" TEXT,
ADD COLUMN     "snap_token" TEXT,
ADD COLUMN     "transaction_time" TIMESTAMP(3),
ALTER COLUMN "provider_transaction_id" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_order_id_key" ON "payment_transactions"("provider_order_id");
