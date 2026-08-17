import type { ActiveRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/lib/prisma";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/middlewares/error.middleware";

export const requireActiveRole = (requiredRole: ActiveRole) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        next(new UnauthorizedError("Authentication required"));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { lastActiveRole: true },
      });

      if (!user) {
        next(new UnauthorizedError("User no longer exists"));
        return;
      }

      if (user.lastActiveRole !== requiredRole) {
        next(
          new ForbiddenError(
            `Access forbidden: active role must be ${requiredRole}`,
          ),
        );
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
