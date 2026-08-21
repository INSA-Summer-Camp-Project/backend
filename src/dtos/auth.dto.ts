import { z } from "zod";
import type { SystemRole, ActiveRole } from "@prisma/client";

// DTO Schemas
export const UpdateRoleDtoSchema = z.object({
  activeRole: z.enum(["CUSTOMER", "WORKER"]),
});

export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>;

export const OnboardUserDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  birthdate: z.string().datetime({ message: "Invalid date format" }),
  gender: z.string().min(1, "Gender is required"),
  activeRole: z.enum(["CUSTOMER", "WORKER"]),
});

export type OnboardUserDto = z.infer<typeof OnboardUserDtoSchema>;

// Response DTOs
export interface UserPublicDto {
  id: string;
  name: string;
  telegramId: string | null;
  avatarUrl?: string | null;
  systemRole: SystemRole;
  lastActiveRole: ActiveRole | null;
  isOnboarded: boolean;
  birthdate: Date | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerProfile?: { id: string; createdAt: Date; updatedAt: Date } | null;
  worker?: {
    id: string;
    bio?: string | null;
    experienceYears?: number;
    ratingAvg?: number | string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponseDto {
  user: UserPublicDto;
  tokens: AuthTokensDto;
}
