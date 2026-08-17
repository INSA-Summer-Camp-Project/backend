import { z } from "zod";
import type { SystemRole, ActiveRole } from "@prisma/client";

// DTO Schemas
export const UpdateRoleDtoSchema = z.object({
  activeRole: z.enum(["CUSTOMER", "WORKER"]),
});

export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>;

// Response DTOs
export interface UserPublicDto {
  id: string;
  name: string;
  telegramId: string;
  systemRole: SystemRole;
  lastActiveRole: ActiveRole | null;
  createdAt: Date;
  updatedAt: Date;
  customerProfile?: { id: string; createdAt: Date; updatedAt: Date } | null;
  workerProfile?: { id: string; createdAt: Date; updatedAt: Date } | null;
}

export interface AuthTokensDto {
  accessToken: string;
}

export interface LoginResponseDto {
  user: UserPublicDto;
  tokens: AuthTokensDto;
}
