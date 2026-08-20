-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "comment" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_key" ON "Review"("jobId");

-- CreateIndex
CREATE INDEX "Review_workerId_idx" ON "Review"("workerId");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");
