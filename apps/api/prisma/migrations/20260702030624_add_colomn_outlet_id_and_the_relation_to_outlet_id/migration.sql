/*
  Warnings:

  - Added the required column `outlet_id` to the `walk_in_customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "walk_in_customers" ADD COLUMN     "outlet_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "walk_in_customers" ADD CONSTRAINT "walk_in_customers_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
