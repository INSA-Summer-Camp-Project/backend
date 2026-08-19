import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/middlewares/error.middleware";

export const getWorkerReputation = async (workerId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { id: true, ratingAvg: true },
  });

  if (!worker) {
    throw new NotFoundError("Worker not found");
  }

  // 1. Rating distribution
  const groupByRating = await prisma.review.groupBy({
    by: ["rating"],
    where: { workerId, reviewerRole: "CUSTOMER_TO_WORKER" },
    _count: { rating: true },
  });

  const distribution: Record<string, number> = {
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0,
  };

  let totalReviews = 0;
  groupByRating.forEach((item) => {
    const star = String(item.rating);
    distribution[star] = item._count.rating;
    totalReviews += item._count.rating;
  });

  // 2. Job completion metrics
  const completedJobs = await prisma.job.count({
    where: {
      assignedWorkerId: workerId,
      status: "COMPLETED",
    },
  });

  const cancelledJobs = await prisma.job.count({
    where: {
      assignedWorkerId: workerId,
      status: "CANCELLED",
    },
  });

  const totalFinishedOrCancelled = completedJobs + cancelledJobs;
  const jobCompletionRate =
    totalFinishedOrCancelled > 0
      ? Math.round((completedJobs / totalFinishedOrCancelled) * 100 * 10) / 10
      : 100.0;

  // 3. Repeat customers
  const repeatCustomerGroups = await prisma.job.groupBy({
    by: ["customerId"],
    where: {
      assignedWorkerId: workerId,
      status: "COMPLETED",
    },
    _count: { id: true },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  const repeatCustomers = repeatCustomerGroups.length;

  // 4. Derive Dynamic Badges
  const ratingAvgNum = Number(worker.ratingAvg);
  const badges: string[] = [];

  if (ratingAvgNum >= 4.8 && totalReviews >= 10) {
    badges.push("TOP_RATED");
  }
  if (jobCompletionRate >= 95.0 && completedJobs >= 5) {
    badges.push("HIGH_COMPLETION");
  }
  if (completedJobs >= 25) {
    badges.push("VETERAN_PRO");
  }

  return {
    workerId,
    rating_avg: ratingAvgNum,
    totalReviews,
    distribution,
    metrics: {
      completedJobs,
      jobCompletionRate,
      repeatCustomers,
    },
    badges,
  };
};
