import type { ActiveRole, SystemRole } from "@prisma/client";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import type {
  AuthTokensDto,
  LoginResponseDto,
  UserPublicDto,
} from "@/dtos/auth.dto";
import { BadRequestError, NotFoundError } from "@/errors";
import { prisma } from "@/lib/prisma";
import { invalidateActiveRoleCache } from "@/middlewares/active-role.middleware";
import { userSelect } from "@/queries/user.queries";

type JwtExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const generateTokens = (
  userId: string,
  role: SystemRole,
): AuthTokensDto => {
  const accessOptions: jwt.SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
  };

  const accessToken = jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    accessOptions,
  );

  return { accessToken };
};

export const getCurrentUser = async (
  userId: string,
): Promise<UserPublicDto> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user as UserPublicDto;
};

export const updateActiveRole = async (
  userId: string,
  activeRole: ActiveRole,
): Promise<UserPublicDto> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      workerProfile: { select: { id: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (activeRole === "WORKER" && !user.workerProfile) {
    throw new BadRequestError(
      "Cannot switch to WORKER role without a worker profile.",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { lastActiveRole: activeRole },
    select: userSelect,
  });

  invalidateActiveRoleCache(userId);

  return updatedUser as UserPublicDto;
};

export const loginWithTelegram = async (telegram: {
  sub: string;
  name?: string;
  preferred_username?: string;
  avatarUrl?: string;
}): Promise<LoginResponseDto> => {
  let user = await prisma.user.findUnique({
    where: { telegramId: telegram.sub },
    select: userSelect,
  });

  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: telegram.name ?? telegram.preferred_username ?? "Telegram User",
          telegramId: telegram.sub,
          systemRole: "USER",
        },
      });

      await tx.customerProfile.create({
        data: { userId: newUser.id },
      });

      await tx.workerProfile.create({
        data: {
          userId: newUser.id,
          bio: "",
          experience: "",
        },
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        select: userSelect,
      });
    });
  }

  if (!user) {
    throw new BadRequestError("Telegram account creation failed");
  }

  const tokens = generateTokens(user.id, user.systemRole);

  return {
    user: user as UserPublicDto,
    tokens,
  };
};
