/*
  Warnings:

  - You are about to drop the `user_providers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_providers" DROP CONSTRAINT "user_providers_user_id_fkey";

-- DropTable
DROP TABLE "user_providers";
