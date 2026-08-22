import type { Prisma, ActiveRole, ReviewerRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from "@/middlewares/error.middleware";
import { createNotification } from "@/services/notification.service";
import type {
  CreateReviewDto,
  UpdateReviewDto,
  WorkerReviewsQueryDto,
} from "@/dtos/review.dto";

// ---------------------------------------------------------------------------
// Helpers: Recalculate Average Ratings atomically inside transactions
// ---------------------------------------------------------------------------
export const recalculateWorkerRatingAvg = async (
  tx: Prisma.TransactionClient,
  workerId: string,
): Promise<number> => {
  const aggregate = await tx.review.aggregate({
    where: { workerId, reviewerRole: "CUSTOMER_TO_WORKER" },
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

export const recalculateCustomerRatingAvg = async (
  tx: Prisma.TransactionClient,
  customerId: string,
): Promise<number> => {
  const aggregate = await tx.review.aggregate({
    where: { customerId, reviewerRole: "WORKER_TO_CUSTOMER" },
    _avg: { rating: true },
  });

  const rawAvg = aggregate._avg.rating ?? 0;
  const ratingAvg = Math.round(rawAvg * 100) / 100;

  await tx.customerProfile.update({
    where: { id: customerId },
    data: { ratingAvg },
  });

  return ratingAvg;
};

// ---------------------------------------------------------------------------
export const createReview = async (
  userId: string,
  activeRole: ActiveRole | undefined,
  data: CreateReviewDto,
) => {
  let role = activeRole;
  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveRole: true },
    });
    role = user?.lastActiveRole ?? "CUSTOMER";
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

  if (job.status !== "COMPLETED") {
    throw new BadRequestError("Reviews are only permitted for completed jobs");
  }

  if (!job.assignedWorkerId || !job.assignedWorker) {
    throw new BadRequestError("Job has no assigned worker");
  }

  // Anti-Self-Review Guard
  if (job.customer.userId === job.assignedWorker.userId) {
    throw new BadRequestError("Cannot review your own contract");
  }

  let reviewerRole: ReviewerRole;
  const targetCustomerId = job.customerId;
  const targetWorkerId = job.assignedWorkerId;

  const isCustomer = job.customer.userId === userId;
  const isWorker = job.assignedWorker.userId === userId;

  if (!isCustomer && !isWorker) {
    throw new ForbiddenError("You are not a participant in this job contract");
  }

  if (isCustomer) {
    reviewerRole = "CUSTOMER_TO_WORKER";
  } else {
    reviewerRole = "WORKER_TO_CUSTOMER";
  }

  // Unique Contract Review Guard for this role
  const existingReview = await prisma.review.findUnique({
    where: {
      jobId_reviewerRole: {
        jobId: data.jobId,
        reviewerRole,
      },
    },
  });
  if (existingReview) {
    throw new ConflictError(
      "A review has already been submitted for this job contract",
    );
  }

  const createdReview = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId: job.id,
        customerId: targetCustomerId,
        workerId: targetWorkerId,
        reviewerRole,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });

    if (reviewerRole === "CUSTOMER_TO_WORKER") {
      await recalculateWorkerRatingAvg(tx, targetWorkerId);
    } else {
      await recalculateCustomerRatingAvg(tx, targetCustomerId);
    }

    return review;
  });

  // Notify the reviewed party
  if (reviewerRole === "CUSTOMER_TO_WORKER") {
    await createNotification(
      { kind: "worker", workerId: job.assignedWorker!.id },
      "New Review Received ⭐",
      `You received a ${data.rating}-star review for "${job.title}".`,
      "NEW_REVIEW",
      `/worker/jobs/${job.id}`,
    ).catch(() => {});
  } else {
    await createNotification(
      { kind: "customer", customerProfileId: job.customer.id },
      "New Review Received ⭐",
      `You received a ${data.rating}-star review for "${job.title}".`,
      "NEW_REVIEW",
      `/customer/jobs/${job.id}`,
    ).catch(() => {});
  }

  return createdReview;
};

// ---------------------------------------------------------------------------
// 2. Get public reviews for a worker (CUSTOMER_TO_WORKER)
// ---------------------------------------------------------------------------
export const getWorkerReviews = async (
  workerId: string,
  query: WorkerReviewsQueryDto,
) => {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new NotFoundError("Worker not found");
  }

  const where: Prisma.ReviewWhereInput = {
    workerId,
    reviewerRole: "CUSTOMER_TO_WORKER",
  };
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
// 3. Get public reviews for a customer (WORKER_TO_CUSTOMER)
// ---------------------------------------------------------------------------
export const getCustomerReviews = async (
  customerId: string,
  query: { page?: number; limit?: number },
) => {
  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
  });
  if (!customer) {
    throw new NotFoundError("Customer profile not found");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    customerId,
    reviewerRole: "WORKER_TO_CUSTOMER",
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        worker: {
          include: {
            user: { select: { name: true } },
          },
        },
        job: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const data = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    worker: {
      id: r.worker.id,
      user: { name: r.worker.user.name },
    },
    job: {
      id: r.job.id,
      title: r.job.title,
    },
  }));

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ---------------------------------------------------------------------------
// 4. Get reviews submitted or received by current authenticated user
// ---------------------------------------------------------------------------
export const getMyReviews = async (
  userId: string,
  activeRole?: ActiveRole | null,
) => {
  let role = activeRole;
  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveRole: true },
    });
    role = user?.lastActiveRole ?? "CUSTOMER";
  }

  if (role === "WORKER") {
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
// 5. Update an existing review within 48 hours
// ---------------------------------------------------------------------------
export const updateReview = async (
  userId: string,
  reviewId: string,
  data: UpdateReviewDto,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      customer: { select: { userId: true } },
      worker: { select: { userId: true } },
    },
  });
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  const isCustomerAuthor =
    review.reviewerRole === "CUSTOMER_TO_WORKER" &&
    review.customer.userId === userId;
  const isWorkerAuthor =
    review.reviewerRole === "WORKER_TO_CUSTOMER" &&
    review.worker.userId === userId;

  if (!isCustomerAuthor && !isWorkerAuthor) {
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
        ...(data.comment !== undefined && { comment: data.comment ?? null }),
      },
    });

    if (review.reviewerRole === "CUSTOMER_TO_WORKER") {
      await recalculateWorkerRatingAvg(tx, review.workerId);
    } else {
      await recalculateCustomerRatingAvg(tx, review.customerId);
    }

    return updated;
  });
};

// ---------------------------------------------------------------------------
// 6. Delete a review (Author or ADMIN)
// ---------------------------------------------------------------------------
export const deleteReview = async (
  userId: string,
  systemRole: string,
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      customer: { select: { userId: true } },
      worker: { select: { userId: true } },
    },
  });
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  const isCustomerAuthor =
    review.reviewerRole === "CUSTOMER_TO_WORKER" &&
    review.customer.userId === userId;
  const isWorkerAuthor =
    review.reviewerRole === "WORKER_TO_CUSTOMER" &&
    review.worker.userId === userId;
  const isAdmin = systemRole === "ADMIN";

  if (!isCustomerAuthor && !isWorkerAuthor && !isAdmin) {
    throw new ForbiddenError("You are not authorized to delete this review");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({
      where: { id: reviewId },
    });

    if (review.reviewerRole === "CUSTOMER_TO_WORKER") {
      await recalculateWorkerRatingAvg(tx, review.workerId);
    } else {
      await recalculateCustomerRatingAvg(tx, review.customerId);
    }
  });

  return { success: true, message: "Review removed" };
};
