import { ActiveRole } from "@prisma/client";

import type { CompleteOnboardingDto } from "@/dtos/onboarding.dto";
import { NotFoundError } from "@/errors";
import { prisma } from "@/lib/prisma";
import { invalidateActiveRoleCache } from "@/middlewares/active-role.middleware";
import { userSelect } from "@/queries/user.queries";

export const getOnboardingStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      lastActiveRole: true,
      customerProfile: { select: { id: true, bio: true } },
      workerProfile: { select: { id: true, bio: true, experience: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    hasCompletedOnboarding: user.lastActiveRole !== null,
    activeRole: user.lastActiveRole,
    hasCustomerProfile: user.customerProfile !== null,
    hasWorkerProfile: user.workerProfile !== null,
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
      workerProfile: { select: { id: true } },
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

    if (dto.activeRole === ActiveRole.WORKER && user.workerProfile) {
      const workerUpdate: Record<string, unknown> = {};

      if (dto.bio !== undefined) workerUpdate.bio = dto.bio;
      if (dto.experience !== undefined)
        workerUpdate.experience = dto.experience;

      if (Object.keys(workerUpdate).length > 0) {
        await tx.workerProfile.update({
          where: { id: user.workerProfile.id },
          data: workerUpdate,
        });
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        const workerProfileId = user.workerProfile.id;

        await tx.workerService.deleteMany({
          where: { workerProfileId },
        });

        await tx.workerService.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            workerProfileId,
            categoryId,
          })),
        });
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveRole: dto.activeRole },
    });

    invalidateActiveRoleCache(userId);

    const updatedUser = await tx.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    return updatedUser;
  });
};
