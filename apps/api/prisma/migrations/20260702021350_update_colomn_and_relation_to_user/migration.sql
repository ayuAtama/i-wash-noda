/*
  Warnings:

  - Added the required column `crated_by` to the `walk_in_customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "walk_in_customers" ADD COLUMN     "crated_by" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "walk_in_customers" ADD CONSTRAINT "walk_in_customers_crated_by_fkey" FOREIGN KEY ("crated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
