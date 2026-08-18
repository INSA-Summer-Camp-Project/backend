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
  experience: true,
  baseRate: true,
  averageRating: true,
  profileImageUrl: true,
  profileImagePublicId: true,
  verifiedJobCount: true,
  verifiedEarningsTotal: true,
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
    select: { id: true, workerProfile: { select: { id: true } } },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.workerProfile) {
    throw new ConflictError("Worker profile already exists for this user");
  }

  const categories = await prisma.serviceCategory.findMany({
    where: { id: { in: dto.categoryIds } },
    select: { id: true },
  });

  if (categories.length !== dto.categoryIds.length) {
    throw new BadRequestError(
      "One or more specified service category IDs are invalid",
    );
  }

  return prisma.$transaction(async (tx) => {
    const profile = await tx.workerProfile.create({
      data: {
        userId,
        bio: dto.bio,
        experience: dto.experience,
        baseRate: dto.baseRate ? dto.baseRate : null,
        services: {
          create: dto.categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveRole: "WORKER" },
    });

    return tx.workerProfile.findUnique({
      where: { id: profile.id },
      select: workerProfileSelect,
    });
  });
};

export const addPortfolioItem = async (
  userId: string,
  dto: CreatePortfolioItemDto,
) => {
  const worker = await prisma.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!worker) {
    throw new NotFoundError(
      "Worker profile not found. Please register as a worker first.",
    );
  }

  return prisma.portfolioItem.create({
    data: {
      workerId: worker.id,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      imagePublicId: dto.imagePublicId,
    },
  });
};

export const addCertificate = async (
  userId: string,
  dto: CreateCertificateDto,
) => {
  const worker = await prisma.workerProfile.findUnique({
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
      filePublicId: dto.filePublicId,
    },
  });
};
