import jwt from "jsonwebtoken";
import type { ActiveRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/middlewares/error.middleware";
import type {
  UserPublicDto,
  AuthTokensDto,
  LoginResponseDto,
  OnboardUserDto,
} from "@/dtos/auth.dto";
import { generateRandomToken, hashToken } from "@/utils/crypto.util";

const userSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  telegramId: true,
  systemRole: true,
  lastActiveRole: true,
  isOnboarded: true,
  birthdate: true,
  gender: true,
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
      bio: true,
      experienceYears: true,
      ratingAvg: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

type JwtExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const createAccessToken = (
  userId: string,
  role: string,
  isOnboarded: boolean = false,
  activeRole?: string | null,
): string => {
  const accessOptions: jwt.SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
  };

  return jwt.sign(
    { id: userId, role, isOnboarded, activeRole },
    env.JWT_SECRET,
    accessOptions,
  );
};

export const createRefreshToken = async (
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<string> => {
  const rawRefreshToken = generateRandomToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await tx.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return rawRefreshToken;
};

export const generateTokenPair = async (
  userId: string,
  role: string,
  isOnboarded: boolean = false,
  activeRole?: string | null,
): Promise<AuthTokensDto> => {
  const accessToken = createAccessToken(userId, role, isOnboarded, activeRole);
  const refreshToken = await createRefreshToken(prisma, userId);
  return { accessToken, refreshToken };
};

export const verifyAndRotateRefreshToken = async (
  rawRefreshToken: string,
): Promise<AuthTokensDto> => {
  const tokenHash = hashToken(rawRefreshToken);

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          systemRole: true,
          isOnboarded: true,
          lastActiveRole: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (tokenRecord.revokedAt) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (new Date() > tokenRecord.expiresAt) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  return prisma.$transaction(async (tx) => {
    // Revoke the old token
    await tx.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const accessToken = createAccessToken(
      tokenRecord.userId,
      tokenRecord.user.systemRole,
      tokenRecord.user.isOnboarded,
      tokenRecord.user.lastActiveRole,
    );
    const refreshToken = await createRefreshToken(tx, tokenRecord.userId);
    return { accessToken, refreshToken };
  });
};

export const revokeRefreshToken = async (
  rawRefreshToken: string,
): Promise<void> => {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
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

  return user as unknown as UserPublicDto;
};

export const updateActiveRole = async (
  userId: string,
  activeRole: ActiveRole,
): Promise<UserPublicDto> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      worker: { select: { id: true } },
      customerProfile: { select: { id: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (activeRole === "WORKER" && !user.worker) {
    await prisma.worker.create({
      data: { userId },
    });
  }

  if (activeRole === "CUSTOMER" && !user.customerProfile) {
    await prisma.customerProfile.create({
      data: { userId },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { lastActiveRole: activeRole },
    select: userSelect,
  });

  return updatedUser as unknown as UserPublicDto;
};

export const onboardUser = async (
  userId: string,
  data: OnboardUserDto,
): Promise<UserPublicDto> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isOnboarded) {
    throw new BadRequestError("User is already onboarded");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      gender: data.gender,
      lastActiveRole: data.activeRole,
      isOnboarded: true,
      customerProfile: {
        create: {},
      },
      worker: {
        create: {},
      },
    },
    select: userSelect,
  });

  return updatedUser as unknown as UserPublicDto;
};

export const loginWithTelegram = async (telegram: {
  sub: string;
  name?: string | null;
  preferred_username?: string | null;
  avatarUrl?: string | null;
}): Promise<LoginResponseDto> => {
  let user = await prisma.user.findUnique({
    where: { telegramId: telegram.sub },
    select: userSelect,
  });

  if (!user) {
    try {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name:
              telegram.name ?? telegram.preferred_username ?? "Telegram User",
            avatarUrl: telegram.avatarUrl || null,
            telegramId: telegram.sub,
            systemRole: "USER",
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          select: userSelect,
        });
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        // Another concurrent request just created the user
        user = await prisma.user.findUnique({
          where: { telegramId: telegram.sub },
          select: userSelect,
        });
      } else {
        throw error;
      }
    }
  } else {
    // If the user exists, we should still update their name and avatar
    // in case they changed it on Telegram.
    const telegramName =
      telegram.name ?? telegram.preferred_username ?? "Telegram User";

    // Only update if something changed to avoid unnecessary DB writes
    const shouldUpdateName = !user.isOnboarded && user.name !== telegramName;
    const shouldUpdateAvatar = user.avatarUrl !== telegram.avatarUrl;

    if (shouldUpdateName || shouldUpdateAvatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(shouldUpdateName && { name: telegramName }),
          ...(shouldUpdateAvatar && { avatarUrl: telegram.avatarUrl || null }),
        },
        select: userSelect,
      });
    }
  }

  if (!user) {
    throw new BadRequestError("Telegram account creation failed");
  }

  const tokens = await generateTokenPair(
    user.id,
    user.systemRole,
    user.isOnboarded,
    user.lastActiveRole,
  );

  return {
    user: user as unknown as UserPublicDto,
    tokens,
  };
};
