import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { UnauthorizedError } from "@/middlewares/error.middleware";
import type { JwtPayload } from "@/types/auth";

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded?.id || !decoded.role) {
      throw new UnauthorizedError("Invalid token payload");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    throw error;
  }
};
