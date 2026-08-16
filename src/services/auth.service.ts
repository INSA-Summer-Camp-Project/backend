import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@/middlewares/error.middleware";
import type {
  RegisterInput,
  LoginInput,
  UserPublicResponse,
  AuthTokens,
  LoginResponse,
  JwtPayload,
} from "@/types/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  telegramId: true,
  telegramUsername: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  customer: {
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
  business: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

type JwtExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const generateTokens = (userId: string, role: Role): AuthTokens => {
  const accessOptions: jwt.SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
  };
  const refreshOptions: jwt.SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as JwtExpiresIn,
  };

  const accessToken = jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    accessOptions,
  );
  const refreshToken = jwt.sign(
    { id: userId, role },
    env.JWT_REFRESH_SECRET,
    refreshOptions,
  );

  return { accessToken, refreshToken };
};

export const registerUser = async (
  dto: RegisterInput,
): Promise<UserPublicResponse> => {
  const existingEmail = await prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existingEmail) {
    throw new ConflictError("User with this email already exists");
  }

  if (dto.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingPhone) {
      throw new ConflictError("User with this phone number already exists");
    }
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(dto.password, saltRounds);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        passwordHash,
        role: dto.role,
        telegramUsername: dto.telegramUsername || null,
      },
    });

    if (dto.role === "CUSTOMER") {
      await tx.customer.create({
        data: { userId: newUser.id },
      });
    } else if (dto.role === "WORKER") {
      await tx.worker.create({
        data: { userId: newUser.id },
      });
    } else if (dto.role === "BUSINESS") {
      await tx.business.create({
        data: { userId: newUser.id },
      });
    }

    const fetchedUser = await tx.user.findUnique({
      where: { id: newUser.id },
      select: userSelect,
    });

    return fetchedUser;
  });

  if (!user) {
    throw new BadRequestError("User registration failed");
  }

  return user as UserPublicResponse;
};

export const loginUser = async (dto: LoginInput): Promise<LoginResponse> => {
  const credential = dto.credential || dto.email || dto.phone;

  if (!credential) {
    throw new BadRequestError("Email or phone credential is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: credential }, { phone: credential }],
    },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email/phone or password");
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError(
      "Password login not configured for this account",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email/phone or password");
  }

  const tokens = generateTokens(user.id, user.role);

  const { passwordHash: _, ...publicUser } = user;

  return {
    user: publicUser as UserPublicResponse,
    tokens,
  };
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string }> => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    ) as JwtPayload;

    if (!decoded?.id) {
      throw new UnauthorizedError("Invalid refresh token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
    }

    const accessOptions: jwt.SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
    };

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      accessOptions,
    );

    return { accessToken };
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    throw error;
  }
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

export const loginWithTelegram = async (telegram: {
  sub: string;
  name?: string;
  preferred_username?: string;
  phone_number?: string;
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
          email: null,
          phone: telegram.phone_number ?? null,
          passwordHash: null,
          telegramId: telegram.sub,
          telegramUsername: telegram.preferred_username ?? null,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });

      await tx.customer.create({
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

  if (user.status !== "ACTIVE") {
    throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
  }

  const tokens = generateTokens(user.id, user.role);

  return {
    user: user as UserPublicResponse,
    tokens,
  };
};
