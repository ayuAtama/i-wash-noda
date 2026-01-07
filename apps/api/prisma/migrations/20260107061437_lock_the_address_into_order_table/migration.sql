-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup_address_id" UUID;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_address_id_fkey" FOREIGN KEY ("pickup_address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
