import { z } from "zod";
import type { Role, UserStatus } from "@prisma/client";

// Zod DTO Schemas
export const RegisterInputSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z
      .enum(["CUSTOMER", "WORKER", "BUSINESS", "ADMIN"])
      .default("CUSTOMER"),
    telegramUsername: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // FR-002: Phone number mandatory for customer accounts
    if (data.role === "CUSTOMER" && (!data.phone || data.phone.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is mandatory for customer accounts",
        path: ["phone"],
      });
    }
  });

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    credential: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone && !data.credential) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either email or phone credential must be provided",
        path: ["email"],
      });
    }
  });

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

// Auth-specific payload types & user profiles
export interface UserPayload {
  id: string;
  role: Role;
}

export interface JwtPayload {
  id: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface UserPublicResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  telegramId: string | null;
  telegramUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: { id: string; createdAt: Date; updatedAt: Date } | null;
  worker?: { id: string; createdAt: Date; updatedAt: Date } | null;
  business?: { id: string; createdAt: Date; updatedAt: Date } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
