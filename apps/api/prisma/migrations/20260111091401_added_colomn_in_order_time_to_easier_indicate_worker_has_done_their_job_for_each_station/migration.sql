-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "ironing_completed_at" TIMESTAMP(3),
ADD COLUMN     "packing_completed_at" TIMESTAMP(3),
ADD COLUMN     "washing_completed_at" TIMESTAMP(3);
