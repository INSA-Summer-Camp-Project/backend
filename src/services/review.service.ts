import type { Prisma, ActiveRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from "@/middlewares/error.middleware";
import type {
  CreateReviewDto,
  UpdateReviewDto,
  WorkerReviewsQueryDto,
} from "@/dtos/review.dto";

// ---------------------------------------------------------------------------
// Helper: Recalculate Worker.ratingAvg atomically inside transaction
// ---------------------------------------------------------------------------
export const recalculateWorkerRatingAvg = async (
  tx: Prisma.TransactionClient,
  workerId: string,
): Promise<number> => {
  const aggregate = await tx.review.aggregate({
    where: { workerId },
    _avg: { rating: true },
  });

  const rawAvg = aggregate._avg.rating ?? 0;
  const ratingAvg = Math.round(rawAvg * 100) / 100;

  await tx.worker.update({
    where: { id: workerId },
    data: { ratingAvg },
  });

  return ratingAvg;
};

// ---------------------------------------------------------------------------
// 1. Submit a review for a completed job
// ---------------------------------------------------------------------------
export const createReview = async (userId: string, data: CreateReviewDto) => {
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });
  if (!customerProfile) {
    throw new ForbiddenError("Customer profile not found for this user");
  }

  const job = await prisma.job.findUnique({
    where: { id: data.jobId },
    include: {
      customer: { select: { id: true, userId: true } },
      assignedWorker: { select: { id: true, userId: true } },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  // Job Completion Invariant
  if (job.status !== "COMPLETED") {
    throw new BadRequestError("Reviews are only permitted for completed jobs");
  }

  // Contract Participation Invariant
  if (job.customerId !== customerProfile.id) {
    throw new ForbiddenError("You do not own this completed job contract");
  }
  if (!job.assignedWorkerId || !job.assignedWorker) {
    throw new BadRequestError("No worker was assigned to this completed job");
  }

  // Anti-Self-Review Guard
  if (job.customer.userId === job.assignedWorker.userId) {
    throw new BadRequestError("Cannot review your own worker profile");
  }

  // Unique Contract Review Guard
  const existingReview = await prisma.review.findUnique({
    where: { jobId: data.jobId },
  });
  if (existingReview) {
    throw new ConflictError("A review has already been submitted for this job");
  }

  // Atomic Transaction
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId: data.jobId,
        customerId: customerProfile.id,
        workerId: job.assignedWorkerId!,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });

    await recalculateWorkerRatingAvg(tx, job.assignedWorkerId!);

    return review;
  });
};

// ---------------------------------------------------------------------------
// 2. Get public reviews for a worker
// ---------------------------------------------------------------------------
export const getWorkerReviews = async (
  workerId: string,
  query: WorkerReviewsQueryDto,
) => {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new NotFoundError("Worker not found");
  }

  const where: Prisma.ReviewWhereInput = { workerId };
  if (query.rating !== undefined) {
    where.rating = query.rating;
  }

  const skip = (query.page - 1) * query.limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        job: {
          select: {
            title: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.review.count({ where }),
  ]);

  const data = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    customer: {
      name: r.customer.user.name,
      avatar: null,
    },
    job: {
      title: r.job.title,
      category: r.job.category.name,
    },
  }));

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

// ---------------------------------------------------------------------------
// 3. Get reviews submitted or received by current authenticated user
// ---------------------------------------------------------------------------
export const getMyReviews = async (
  userId: string,
  activeRole?: ActiveRole | null,
) => {
  if (activeRole === "WORKER") {
    const worker = await prisma.worker.findUnique({ where: { userId } });
    if (!worker) {
      throw new ForbiddenError("Worker profile not found");
    }
    return prisma.review.findMany({
      where: { workerId: worker.id },
      include: {
        job: {
          select: {
            title: true,
            category: { select: { name: true } },
          },
        },
        customer: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // CUSTOMER view or fallback
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });
  if (!customerProfile) {
    throw new ForbiddenError("Customer profile not found");
  }

  return prisma.review.findMany({
    where: { customerId: customerProfile.id },
    include: {
      job: {
        select: {
          title: true,
          category: { select: { name: true } },
        },
      },
      worker: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ---------------------------------------------------------------------------
// 4. Update an existing review within 48 hours
// ---------------------------------------------------------------------------
export const updateReview = async (
  userId: string,
  reviewId: string,
  data: UpdateReviewDto,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });
  if (!customerProfile || review.customerId !== customerProfile.id) {
    throw new ForbiddenError("You do not own this review");
  }

  const hoursDiff =
    (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursDiff > 48) {
    throw new ForbiddenError("Review edit window has expired");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
    });

    await recalculateWorkerRatingAvg(tx, review.workerId);

    return updated;
  });
};

// ---------------------------------------------------------------------------
// 5. Delete a review (Author or ADMIN)
// ---------------------------------------------------------------------------
export const deleteReview = async (
  userId: string,
  systemRole: string,
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });
  const isAuthor = customerProfile && review.customerId === customerProfile.id;
  const isAdmin = systemRole === "ADMIN";

  if (!isAuthor && !isAdmin) {
    throw new ForbiddenError("You are not authorized to delete this review");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({
      where: { id: reviewId },
    });

    await recalculateWorkerRatingAvg(tx, review.workerId);
  });

  return { success: true, message: "Review removed" };
};
