/*
  Warnings:

  - You are about to drop the `payment_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payment_transactions" DROP CONSTRAINT "payment_transactions_order_id_fkey";

-- DropTable
DROP TABLE "payment_transactions";

-- CreateTable
CREATE TABLE "payment_gateway_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider_transaction_id" UUID,
    "raw_response" JSONB,
    "token" TEXT,
    "gross_amount" INTEGER,
    "payment_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "transaction_status" TEXT,
    "status_code" TEXT,
    "fraud_status" TEXT,
    "transaction_time" TIMESTAMP(3),
    "settlement_time" TIMESTAMP(3),
    "bank" TEXT,
    "va_number" TEXT,
    "issuer" TEXT,
    "acquirer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_gateway_transactions" ADD CONSTRAINT "payment_gateway_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
