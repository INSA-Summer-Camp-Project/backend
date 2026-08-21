import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import type { UserPublicDto } from "@/dtos/auth.dto";

export const registerTestUser = async (data: {
  name: string;
  telegramId?: string;
  role?: "CUSTOMER" | "WORKER";
  systemRole?: "USER" | "ADMIN";
}): Promise<UserPublicDto> => {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      telegramId: data.telegramId ?? `tg_test_${crypto.randomUUID()}`,
      systemRole: data.systemRole ?? "USER",
      lastActiveRole: data.role ?? "CUSTOMER",
      isOnboarded: true,
      birthdate: new Date("1990-01-01"),
      gender: "unspecified",
      customerProfile: { create: {} },
      worker: {
        create: {
          experienceYears: 0,
          ratingAvg: 0.0,
        },
      },
    },
    include: {
      customerProfile: true,
      worker: true,
    },
  });

  return user as unknown as UserPublicDto;
};
