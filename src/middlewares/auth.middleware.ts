import type { NextFunction, Request, Response } from "express";

import { extractToken } from "@/lib/auth/extract-token";
import { verifyToken } from "@/lib/auth/verify-token";
import { UnauthorizedError } from "@/middlewares/error.middleware";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError("Authentication token missing");
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(); // Just continue without user
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    // If token is invalid, we can just proceed as unauthenticated for optional
    next();
  }
};
