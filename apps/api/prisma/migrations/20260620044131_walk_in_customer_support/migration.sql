/*
  Warnings:

  - Added the required column `source` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('customer_app', 'walk_in');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'out_for_pickup';
ALTER TYPE "OrderStatus" ADD VALUE 'waiting_for_driver_deliver';
ALTER TYPE "OrderStatus" ADD VALUE 'cancelled';
ALTER TYPE "OrderStatus" ADD VALUE 'finished';

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "source" "OrderSource" NOT NULL,
ADD COLUMN     "walkin_customer_id" UUID,
ALTER COLUMN "customer_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "walk_in_customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "walk_in_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "walk_in_customers_phone_key" ON "walk_in_customers"("phone");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_walkin_customer_id_fkey" FOREIGN KEY ("walkin_customer_id") REFERENCES "walk_in_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
