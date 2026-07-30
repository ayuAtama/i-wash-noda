/*
  Warnings:

  - Added the required column `status` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('pending', 'resolved', 'rejected');

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "admin_id" UUID,
ADD COLUMN     "admin_response" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "status" "ComplaintStatus" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
