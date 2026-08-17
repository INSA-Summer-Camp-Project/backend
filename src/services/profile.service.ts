import type {
  CreateCertificateDto,
  CreatePortfolioDto,
  UpdateWorkerProfileDto,
} from "@/dtos/profile.dto";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/middlewares/error.middleware";

export const updateWorkerProfile = async (
  userId: string,
  dto: UpdateWorkerProfileDto,
) => {
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
  });

  if (!workerProfile) {
    throw new NotFoundError("Worker profile not found");
  }

  return prisma.$transaction(async (tx) => {
    // Update the basic profile fields
    await tx.workerProfile.update({
      where: { userId },
      data: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.experience !== undefined && { experience: dto.experience }),
        ...(dto.baseRate !== undefined && { baseRate: dto.baseRate }),
      },
    });

    // If categoryIds is provided, update the worker services
    if (dto.categoryIds !== undefined) {
      // First, remove existing services
      await tx.workerService.deleteMany({
        where: { workerProfileId: workerProfile.id },
      });

      // Then create the new ones
      if (dto.categoryIds.length > 0) {
        await tx.workerService.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            workerProfileId: workerProfile.id,
            categoryId,
          })),
        });
      }
    }

    return tx.workerProfile.findUnique({
      where: { id: workerProfile.id },
      include: {
        services: {
          include: { category: true },
        },
      },
    });
  });
};

export const addPortfolioItem = async (
  userId: string,
  dto: CreatePortfolioDto,
) => {
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
  });

  if (!workerProfile) {
    throw new NotFoundError("Worker profile not found");
  }

  return prisma.portfolioItem.create({
    data: {
      workerId: workerProfile.id,
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
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
  });

  if (!workerProfile) {
    throw new NotFoundError("Worker profile not found");
  }

  return prisma.certificate.create({
    data: {
      workerId: workerProfile.id,
      title: dto.title,
      fileUrl: dto.fileUrl,
      filePublicId: dto.filePublicId,
    },
  });
};
