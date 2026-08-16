import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { parseCookie } from "cookie";
import { env } from "@/config/env";
import {
  UnauthorizedError,
  ForbiddenError,
} from "@/middlewares/error.middleware";
import type { JwtPayload } from "@/types/auth";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length);
    }

    if (!token) {
      const cookies = parseCookie(req.headers.cookie ?? "");
      token = cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError("Authentication token missing");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded?.id || !decoded.role) {
      throw new UnauthorizedError("Invalid token payload");
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      next(new UnauthorizedError("Invalid or expired token"));
      return;
    }
    next(error);
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError("Access forbidden: insufficient permissions"));
      return;
    }

    next();
  };
};
