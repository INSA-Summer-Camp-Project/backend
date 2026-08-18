import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";

export const requireRole = (allowedRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    if (allowedRoles.includes("WORKER")) {
      const worker = await prisma.worker.findUnique({
        where: { userId: req.user.id },
      });
      if (worker) {
        next();
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: "Access denied: insufficient permissions",
    });
  };
};
