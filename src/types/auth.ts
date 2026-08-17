import type { SystemRole } from "@prisma/client";

// Auth-specific payload types (Internal System usage only, not API response DTOs)
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
