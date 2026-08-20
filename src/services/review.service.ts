import { Prisma } from "@prisma/client";

import { getPaginationMeta } from "@/dtos/common.dto";
import type { CreateReviewDto, ReviewQueryDto } from "@/dtos/review.dto";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/errors";
import { prisma } from "@/lib/prisma";

export const createReview = async (userId: string, data: CreateReviewDto) => {
  const { jobId, rating, comment } = data;

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new ForbiddenError("Only customers can submit reviews");
  }

  const customerId = customerProfile.id;

  // 1. Fetch the job and verify ownership/status
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      customerId: true,
      status: true,
      assignedWorkerId: true,
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.customerId !== customerId) {
    throw new ForbiddenError("You can only review your own jobs");
  }

  if (job.status !== "COMPLETED") {
    throw new BadRequestError("You can only review completed jobs");
  }

  if (!job.assignedWorkerId) {
    throw new BadRequestError("Job has no assigned worker to review");
  }

  // 2. Check if a review already exists
  const existingReview = await prisma.review.findFirst({
    where: {
      jobId,
      customerId,
    },
  });

  if (existingReview) {
    throw new ConflictError("You have already reviewed this job");
  }

  // 3. Create the review inside a transaction to ensure rating recalculation consistency
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId,
        customerId,
        workerId: job.assignedWorkerId!,
        rating,
        comment,
      },
    });

    // 4. Recalculate average rating
    const aggregate = await tx.review.aggregate({
      where: { workerId: job.assignedWorkerId! },
      _avg: {
        rating: true,
      },
    });

    const newAverage = aggregate._avg.rating || 0;

    await tx.workerProfile.update({
      where: { id: job.assignedWorkerId! },
      data: {
        averageRating: newAverage,
      },
    });

    return review;
  });
};

export const getReviews = async (query: ReviewQueryDto) => {
  const { page, limit, workerId, jobId, customerId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {};

  if (workerId) where.workerId = workerId;
  if (jobId) where.jobId = jobId;
  if (customerId) where.customerId = customerId;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total),
  };
};

export const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  return review;
};
