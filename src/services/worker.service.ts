import type { PaginationDto } from "@/dtos/common.dto";
import { getPaginationMeta } from "@/dtos/common.dto";
import { NotFoundError } from "@/errors";
import { prisma } from "@/lib/prisma";

export const getWorkers = async (
  pagination: PaginationDto,
  categoryId?: string,
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    ...(categoryId && {
      services: {
        some: { categoryId },
      },
    }),
  };

  const [total, workers] = await Promise.all([
    prisma.workerProfile.count({ where }),
    prisma.workerProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, createdAt: true } },
        services: { include: { category: true } },
      },
      orderBy: { averageRating: "desc" },
    }),
  ]);

  return {
    data: workers,
    meta: getPaginationMeta(page, limit, total),
  };
};

export const getWorkerById = async (id: string) => {
  const worker = await prisma.workerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, createdAt: true } },
      services: { include: { category: true } },
      portfolioItems: true,
      certificates: true,
      reviews: {
        include: {
          customer: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!worker) {
    throw new NotFoundError("Worker not found");
  }

  return worker;
};
