import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/middlewares/error.middleware";
import type { WorkerQueryDto } from "@/dtos/worker.dto";

const workerListSelect = {
  id: true,
  userId: true,
  bio: true,
  experience: true,
  baseRate: true,
  averageRating: true,
  profileImageUrl: true,
  verifiedJobCount: true,
  verifiedEarningsTotal: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      telegramId: true,
    },
  },
  services: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

const workerDetailSelect = {
  ...workerListSelect,
  profileImagePublicId: true,
  updatedAt: true,
  portfolioItems: {
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      imagePublicId: true,
      createdAt: true,
    },
  },
  certificates: {
    select: {
      id: true,
      title: true,
      fileUrl: true,
      filePublicId: true,
      createdAt: true,
    },
  },
  reviews: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      customer: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

/**
 * Retrieves a paginated list of worker profiles based on search and filter parameters.
 * Supports filtering by category ID, keyword search, rating threshold, rate range, and sorting.
 *
 * @param query - Validated WorkerQueryDto containing search criteria & pagination parameters
 */
export const getWorkers = async (query: WorkerQueryDto) => {
  const {
    categoryId,
    search,
    minRating,
    minRate,
    maxRate,
    sortBy,
    page,
    limit,
  } = query;

  // Build dynamic Prisma WHERE conditions array
  const AND: Prisma.WorkerProfileWhereInput[] = [];

  // Filter 1: Service Category
  if (categoryId) {
    AND.push({
      services: {
        some: { categoryId },
      },
    });
  }

  // Filter 2: Keyword search across worker bio, experience, and associated user name
  if (search && search.trim()) {
    const trimmed = search.trim();
    AND.push({
      OR: [
        { bio: { contains: trimmed, mode: "insensitive" } },
        { experience: { contains: trimmed, mode: "insensitive" } },
        { user: { name: { contains: trimmed, mode: "insensitive" } } },
      ],
    });
  }

  // Filter 3: Minimum rating threshold
  if (minRating !== undefined) {
    AND.push({
      averageRating: { gte: minRating },
    });
  }

  // Filter 4: Base rate minimum threshold
  if (minRate !== undefined) {
    AND.push({
      baseRate: { gte: minRate },
    });
  }

  // Filter 5: Base rate maximum threshold
  if (maxRate !== undefined) {
    AND.push({
      baseRate: { lte: maxRate },
    });
  }

  const where: Prisma.WorkerProfileWhereInput = AND.length > 0 ? { AND } : {};

  // Build dynamic Prisma ORDER BY sorting clause
  let orderBy: Prisma.WorkerProfileOrderByWithRelationInput[];

  switch (sortBy) {
    case "jobs":
      orderBy = [{ verifiedJobCount: "desc" }, { averageRating: "desc" }];
      break;
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "rate_asc":
      orderBy = [{ baseRate: "asc" }, { averageRating: "desc" }];
      break;
    case "rate_desc":
      orderBy = [{ baseRate: "desc" }, { averageRating: "desc" }];
      break;
    case "rating":
    default:
      orderBy = [
        { averageRating: "desc" },
        { verifiedJobCount: "desc" },
        { createdAt: "desc" },
      ];
      break;
  }

  // Calculate SQL offset skip value for pagination
  const skip = (page - 1) * limit;

  // Execute database count and query concurrently
  const [workers, total] = await Promise.all([
    prisma.workerProfile.findMany({
      where,
      select: workerListSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.workerProfile.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    workers,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getWorkerById = async (workerId: string) => {
  const worker = await prisma.workerProfile.findFirst({
    where: {
      OR: [{ id: workerId }, { userId: workerId }],
    },
    select: workerDetailSelect,
  });

  if (!worker) {
    throw new NotFoundError("Worker profile not found");
  }

  return worker;
};
