/*
  Warnings:

  - The values [Menunggu_Penjemputan_Driver,Laundry_Sedang_Menuju_Outlet,Laundry_Telah_Sampai_Outlet,Laundry_Sedang_Dicuci,Laundry_Sedang_Disetrika,Laundry_Sedang_Dipacking,Menunggu_Pembayaran,Laundry_Sedang_Dikirim_Menuju_Customer,Laundry_Telah_Diterima_Customer] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('waiting_for_driver_pickup', 'in_transit_to_outlet', 'arrived_at_outlet', 'washing_in_progress', 'ironing_in_progress', 'packing_in_progrees', 'waiting_for_payment', 'out_for_delivery', 'delivered');
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
COMMIT;
