-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "ironing_worker_id" UUID,
ADD COLUMN     "packing_worker_id" UUID,
ADD COLUMN     "washing_worker_id" UUID;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_pickup_id_fkey" FOREIGN KEY ("driver_pickup_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_delivery_id_fkey" FOREIGN KEY ("driver_delivery_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_washing_worker_id_fkey" FOREIGN KEY ("washing_worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_ironing_worker_id_fkey" FOREIGN KEY ("ironing_worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_packing_worker_id_fkey" FOREIGN KEY ("packing_worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
