import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authorize } from "@/middlewares/authorization.middleware";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/middlewares/error.middleware";

describe("Authorization Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};

    mockNext = vi.fn();
  });

  it("should call next with error if no user on request", () => {
    const middleware = authorize(["ADMIN"]);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Authentication required" }),
    );
  });

  it("should call next with error if user role is not in allowed roles", () => {
    mockReq.user = { id: "user-1", role: "USER" };
    const middleware = authorize(["ADMIN"]);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access forbidden: insufficient permissions",
      }),
    );
  });

  it("should call next without error if user role matches exactly one allowed role", () => {
    mockReq.user = { id: "user-1", role: "ADMIN" };
    const middleware = authorize(["ADMIN", "USER"]);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
  });
});
