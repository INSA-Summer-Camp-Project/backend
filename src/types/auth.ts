import { z } from "zod";
import type { SystemRole, ActiveRole } from "@prisma/client";

// Zod DTO Schemas
export const UpdateRoleInputSchema = z.object({
  activeRole: z.enum(["CUSTOMER", "WORKER"]),
});

export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

// Auth-specific payload types
export interface UserPayload {
  id: string;
  role: SystemRole;
}

export interface JwtPayload {
  id: string;
  role: SystemRole;
  iat?: number;
  exp?: number;
}

export interface UserPublicResponse {
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

export interface AuthTokens {
  accessToken: string;
}

export interface LoginResponse {
  user: UserPublicResponse;
  tokens: AuthTokens;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
