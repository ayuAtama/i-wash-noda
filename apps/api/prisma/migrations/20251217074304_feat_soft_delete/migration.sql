-- AlterTable
ALTER TABLE "user_addresses" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "worker_shifts" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
