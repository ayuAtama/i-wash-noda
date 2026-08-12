-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('manual', 'payment_gateway');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" "PaymentMethod";
