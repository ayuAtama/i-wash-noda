/*
  Warnings:

  - You are about to drop the column `order_id` on the `driver_job_status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pickup_request_id]` on the table `driver_job_status` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[delivery_request_id]` on the table `driver_job_status` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "driver_job_status" DROP CONSTRAINT "driver_job_status_order_id_fkey";

-- DropIndex
DROP INDEX "driver_job_status_driver_id_order_id_key";

-- AlterTable
ALTER TABLE "driver_job_status" DROP COLUMN "order_id",
ADD COLUMN     "delivery_request_id" UUID,
ADD COLUMN     "orderId" UUID,
ADD COLUMN     "pickup_request_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "driver_job_status_pickup_request_id_key" ON "driver_job_status"("pickup_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_job_status_delivery_request_id_key" ON "driver_job_status"("delivery_request_id");

-- AddForeignKey
ALTER TABLE "driver_job_status" ADD CONSTRAINT "driver_job_status_pickup_request_id_fkey" FOREIGN KEY ("pickup_request_id") REFERENCES "pickup_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_job_status" ADD CONSTRAINT "driver_job_status_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_job_status" ADD CONSTRAINT "driver_job_status_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
