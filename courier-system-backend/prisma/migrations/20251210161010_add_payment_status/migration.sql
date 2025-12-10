-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "paymentConfirmedAt" TIMESTAMPTZ(6),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ProofPhoto_jobId_idx" ON "ProofPhoto"("jobId");

-- CreateIndex
CREATE INDEX "ProofPhoto_stopId_idx" ON "ProofPhoto"("stopId");

-- CreateIndex
CREATE INDEX "ProofPhoto_driverId_idx" ON "ProofPhoto"("driverId");
