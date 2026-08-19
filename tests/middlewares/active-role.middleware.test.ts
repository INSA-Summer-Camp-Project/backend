import { ActiveRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError } from "@/errors";
import { prisma } from "@/lib/prisma";
import {
  invalidateActiveRoleCache,
  requireActiveRole,
} from "@/middlewares/active-role.middleware";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

describe("Active Role Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};

    mockNext = vi.fn();
    vi.clearAllMocks();
    invalidateActiveRoleCache("user-1");
  });

  it("should call next with error if no user on request", async () => {
    const middleware = requireActiveRole(ActiveRole.CUSTOMER);

    await middleware(
      mockReq as unknown as Parameters<typeof middleware>[0],
      mockRes as unknown as Parameters<typeof middleware>[1],
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Authentication required" }),
    );
  });

  it("should call next with error if user not found in database", async () => {
    mockReq.user = { id: "user-1", role: "USER" };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const middleware = requireActiveRole(ActiveRole.CUSTOMER);
    await middleware(
      mockReq as unknown as Parameters<typeof middleware>[0],
      mockRes as unknown as Parameters<typeof middleware>[1],
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User no longer exists" }),
    );
  });

  it("should call next with error if active role does not match", async () => {
    mockReq.user = { id: "user-1", role: "USER" };
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastActiveRole: ActiveRole.WORKER,
    } as never);

    const middleware = requireActiveRole(ActiveRole.CUSTOMER);
    await middleware(
      mockReq as unknown as Parameters<typeof middleware>[0],
      mockRes as unknown as Parameters<typeof middleware>[1],
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access forbidden: active role must be CUSTOMER",
      }),
    );
  });

  it("should call next without error if active role matches", async () => {
    mockReq.user = { id: "user-1", role: "USER" };
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastActiveRole: ActiveRole.CUSTOMER,
    } as never);

    const middleware = requireActiveRole(ActiveRole.CUSTOMER);
    await middleware(
      mockReq as unknown as Parameters<typeof middleware>[0],
      mockRes as unknown as Parameters<typeof middleware>[1],
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it("should pass any unexpected errors to next", async () => {
    mockReq.user = { id: "user-1", role: "USER" };
    const error = new Error("Database error");
    vi.mocked(prisma.user.findUnique).mockRejectedValue(error);

    const middleware = requireActiveRole(ActiveRole.CUSTOMER);
    await middleware(
      mockReq as unknown as Parameters<typeof middleware>[0],
      mockRes as unknown as Parameters<typeof middleware>[1],
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
