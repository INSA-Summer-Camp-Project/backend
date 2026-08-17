import type { SystemRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import {
  ForbiddenError,
  UnauthorizedError,
} from "@/middlewares/error.middleware";

export const authorize = (allowedRoles: SystemRole[]) => {
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
