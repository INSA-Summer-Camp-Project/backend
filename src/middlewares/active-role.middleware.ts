import type { ActiveRole } from "@prisma/client";
import type { RequestHandler } from "express";
import type { ParsedQs } from "qs";

import { ForbiddenError, UnauthorizedError } from "@/errors";
import { prisma } from "@/lib/prisma";

// Simple memory cache for active roles to avoid hitting the DB on every request
interface CacheEntry {
  role: ActiveRole | null;
  expiresAt: number;
}
const activeRoleCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

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

      const userId = req.user.id;
      const now = Date.now();

      // Check cache
      const cached = activeRoleCache.get(userId);
      let userRole: ActiveRole | null = null;

      if (cached && cached.expiresAt > now) {
        userRole = cached.role;
      } else {
        // Cache miss or expired, fetch from DB
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastActiveRole: true },
        });

        if (!user) {
          next(new UnauthorizedError("User no longer exists"));
          return;
        }

        userRole = user.lastActiveRole;
        // Set cache
        activeRoleCache.set(userId, {
          role: userRole,
          expiresAt: now + CACHE_TTL_MS,
        });
      }

      if (userRole !== requiredRole) {
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

// Export a way to invalidate cache if active role is updated manually
export const invalidateActiveRoleCache = (userId: string) => {
  activeRoleCache.delete(userId);
};
