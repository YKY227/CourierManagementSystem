-- DropForeignKey
ALTER TABLE "JobAssignment" DROP CONSTRAINT "JobAssignment_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobStop" DROP CONSTRAINT "JobStop_jobId_fkey";

-- DropForeignKey
ALTER TABLE "ProofPhoto" DROP CONSTRAINT "ProofPhoto_jobId_fkey";

-- DropForeignKey
ALTER TABLE "ProofPhoto" DROP CONSTRAINT "ProofPhoto_stopId_fkey";

-- AddForeignKey
ALTER TABLE "JobStop" ADD CONSTRAINT "JobStop_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPhoto" ADD CONSTRAINT "ProofPhoto_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPhoto" ADD CONSTRAINT "ProofPhoto_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "JobStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
