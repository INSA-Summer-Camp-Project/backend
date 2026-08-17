import jwt from "jsonwebtoken";
import type { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { BadRequestError, NotFoundError } from "@/middlewares/error.middleware";
import type {
  UserPublicResponse,
  AuthTokens,
  LoginResponse,
} from "@/types/auth";

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
  workerProfile: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

type JwtExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const generateTokens = (
  userId: string,
  role: SystemRole,
): AuthTokens => {
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
): Promise<UserPublicResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user as UserPublicResponse;
};

export const updateActiveRole = async (
  userId: string,
  activeRole: ActiveRole,
): Promise<UserPublicResponse> => {
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

  return updatedUser as UserPublicResponse;
};

export const loginWithTelegram = async (telegram: {
  sub: string;
  name?: string;
  preferred_username?: string;
}): Promise<LoginResponse> => {
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
    user: user as UserPublicResponse,
    tokens,
  };
};
