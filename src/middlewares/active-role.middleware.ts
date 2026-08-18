import type { ActiveRole } from "@prisma/client";
import type { RequestHandler } from "express";
import type { ParsedQs } from "qs";

import { prisma } from "@/lib/prisma";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/middlewares/error.middleware";

export const requireActiveRole =
  <
    P = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
  >(
    requiredRole: ActiveRole,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  async (req, _res, next): Promise<void> => {
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
