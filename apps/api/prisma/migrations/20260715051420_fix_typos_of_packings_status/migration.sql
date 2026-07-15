/*
  Warnings:

  - The values [packing_in_progrees] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('waiting_for_driver_pickup', 'out_for_pickup', 'in_transit_to_outlet', 'arrived_at_outlet', 'washing_in_progress', 'ironing_in_progress', 'packing_in_progress', 'waiting_for_payment', 'waiting_for_driver_deliver', 'out_for_delivery', 'delivered', 'cancelled', 'finished');
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
COMMIT;
