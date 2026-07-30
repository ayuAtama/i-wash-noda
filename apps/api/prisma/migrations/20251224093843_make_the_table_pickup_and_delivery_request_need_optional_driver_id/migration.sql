-- DropForeignKey
ALTER TABLE "delivery_requests" DROP CONSTRAINT "delivery_requests_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "pickup_requests" DROP CONSTRAINT "pickup_requests_driver_id_fkey";

-- AlterTable
ALTER TABLE "delivery_requests" ALTER COLUMN "driver_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pickup_requests" ALTER COLUMN "driver_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
