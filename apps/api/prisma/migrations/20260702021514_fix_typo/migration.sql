/*
  Warnings:

  - You are about to drop the column `crated_by` on the `walk_in_customers` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `walk_in_customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "walk_in_customers" DROP CONSTRAINT "walk_in_customers_crated_by_fkey";

-- AlterTable
ALTER TABLE "walk_in_customers" DROP COLUMN "crated_by",
ADD COLUMN     "created_by" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "walk_in_customers" ADD CONSTRAINT "walk_in_customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
