import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/middlewares/error.middleware";
import type {
  CreateWorkerProfileDto,
  CreatePortfolioItemDto,
  CreateCertificateDto,
} from "@/dtos/profile.dto";

const workerProfileSelect = {
  id: true,
  userId: true,
  bio: true,
  experienceYears: true,
  paymentRate: true,
  ratingAvg: true,
  profilePhoto: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      telegramId: true,
      systemRole: true,
      lastActiveRole: true,
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

export const createWorkerProfile = async (
  userId: string,
  dto: CreateWorkerProfileDto,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, worker: { select: { id: true } } },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.worker) {
    throw new ConflictError("Worker profile already exists for this user");
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: dto.categoryIds } },
    select: { id: true, name: true },
  });

  if (categories.length !== dto.categoryIds.length) {
    throw new BadRequestError(
      "One or more specified service category IDs are invalid",
    );
  }

  return prisma.$transaction(async (tx) => {
    const profile = await tx.worker.create({
      data: {
        userId,
        bio: dto.bio,
        experienceYears: dto.experience
          ? Number.parseInt(dto.experience, 10)
          : 0,
        paymentRate: dto.baseRate ? dto.baseRate : null,
        services: {
          create: categories.map((category) => ({
            categoryId: category.id,
            name: category.name,
          })),
        },
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveRole: "WORKER" },
    });

    return tx.worker.findUnique({
      where: { id: profile.id },
      select: workerProfileSelect,
    });
  });
};

export const addPortfolioItem = async (
  userId: string,
  dto: CreatePortfolioItemDto,
) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!worker) {
    throw new NotFoundError(
      "Worker profile not found. Please register as a worker first.",
    );
  }

  return prisma.portfolio.create({
    data: {
      workerId: worker.id,
      title: dto.title,
      imageUrl: dto.imageUrl,
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.imagePublicId ? { imagePublicId: dto.imagePublicId } : {}),
    },
  });
};

export const addCertificate = async (
  userId: string,
  dto: CreateCertificateDto,
) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!worker) {
    throw new NotFoundError(
      "Worker profile not found. Please register as a worker first.",
    );
  }

  return prisma.certificate.create({
    data: {
      workerId: worker.id,
      title: dto.title,
      fileUrl: dto.fileUrl,
      ...(dto.filePublicId !== undefined && { filePublicId: dto.filePublicId }),
    },
  });
};
