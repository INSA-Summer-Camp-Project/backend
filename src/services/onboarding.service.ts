import type { Prisma } from "@prisma/client";
import type { CompleteOnboardingDto } from "@/dtos/onboarding.dto";
import { NotFoundError } from "@/middlewares/error.middleware";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  telegramId: true,
  systemRole: true,
  isOnboarded: true,
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
      isOnboarded: true,
      lastActiveRole: true,
      customerProfile: { select: { id: true, bio: true } },
      worker: { select: { id: true, bio: true, experienceYears: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    hasCompletedOnboarding: user.isOnboarded,
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
      isOnboarded: true,
      lastActiveRole: true,
      customerProfile: { select: { id: true } },
      worker: { select: { id: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isOnboarded) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  }

  return prisma.$transaction(async (tx) => {
    const userUpdateData: Prisma.UserUpdateInput = {
      isOnboarded: true,
      lastActiveRole: dto.activeRole,
    };

    if (dto.name) {
      userUpdateData.name = dto.name;
    } else if (dto.firstName || dto.lastName) {
      const nameParts: string[] = [];
      if (dto.firstName) nameParts.push(dto.firstName);
      if (dto.lastName) nameParts.push(dto.lastName);
      if (nameParts.length > 0) userUpdateData.name = nameParts.join(" ");
    }

    if (dto.birthdate) {
      userUpdateData.birthdate = new Date(dto.birthdate);
    }
    if (dto.gender) {
      userUpdateData.gender = dto.gender;
    }

    await tx.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    if (!user.customerProfile) {
      await tx.customerProfile.create({
        data: { userId },
      });
    }

    if (!user.worker) {
      await tx.worker.create({
        data: {
          userId,
          experienceYears: 0,
          ratingAvg: 0.0,
        },
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  });
};
