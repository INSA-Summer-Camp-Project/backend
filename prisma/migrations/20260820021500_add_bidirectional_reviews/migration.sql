-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('CUSTOMER_TO_WORKER', 'WORKER_TO_CUSTOMER');

-- DropIndex
DROP INDEX "Review_jobId_key";

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "reviewerRole" "ReviewerRole" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_reviewerRole_key" ON "Review"("jobId", "reviewerRole");
