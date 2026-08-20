import { ActiveRole } from "@prisma/client";

import type { CompleteOnboardingDto } from "@/dtos/onboarding.dto";
import { NotFoundError } from "@/middlewares/error.middleware";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  telegramId: true,
  systemRole: true,
  lastActiveRole: true,
  createdAt: true,
  updatedAt: true,
  customerProfile: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  worker: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

export const getOnboardingStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      lastActiveRole: true,
      customerProfile: { select: { id: true, bio: true } },
      worker: { select: { id: true, bio: true, experienceYears: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    hasCompletedOnboarding: user.lastActiveRole !== null,
    activeRole: user.lastActiveRole,
    hasCustomerProfile: user.customerProfile !== null,
    hasWorkerProfile: user.worker !== null,
  };
};

export const completeOnboarding = async (
  userId: string,
  dto: CompleteOnboardingDto,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      lastActiveRole: true,
      customerProfile: { select: { id: true } },
      worker: { select: { id: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.lastActiveRole !== null) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  }

  return prisma.$transaction(async (tx) => {
    if (dto.name) {
      await tx.user.update({
        where: { id: userId },
        data: { name: dto.name },
      });
    }

    if (dto.activeRole === ActiveRole.WORKER && user.worker) {
      const workerUpdate: Record<string, unknown> = {};
      if (dto.bio !== undefined) workerUpdate.bio = dto.bio;
      if (dto.experience !== undefined)
        workerUpdate.experienceYears = Number(dto.experience) || 0;

      if (Object.keys(workerUpdate).length > 0) {
        await tx.worker.update({
          where: { id: user.worker.id },
          data: workerUpdate,
        });
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        const workerId = user.worker.id;
        await tx.service.deleteMany({ where: { providerId: workerId } });
        await tx.service.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            providerId: workerId,
            categoryId,
            name: "Service",
          })),
        });
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveRole: dto.activeRole },
    });

    return tx.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  });
};
