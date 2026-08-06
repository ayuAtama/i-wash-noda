-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "payment_proof" ADD COLUMN     "status" "PaymentProofStatus" NOT NULL DEFAULT 'pending';
