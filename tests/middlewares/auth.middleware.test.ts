import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/errors";
import { extractToken } from "@/lib/auth/extract-token";
import { verifyToken } from "@/lib/auth/verify-token";
import { authenticate, optionalAuth } from "@/middlewares/auth.middleware";

vi.mock("@/lib/auth/extract-token", () => ({
  extractToken: vi.fn(),
}));

vi.mock("@/lib/auth/verify-token", () => ({
  verifyToken: vi.fn(),
}));

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should set req.user and call next if token is valid", () => {
      vi.mocked(extractToken).mockReturnValue("valid-token");
      vi.mocked(verifyToken).mockReturnValue({ id: "user-1", role: "USER" });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(extractToken).toHaveBeenCalledWith(mockReq);
      expect(verifyToken).toHaveBeenCalledWith("valid-token");
      expect(mockReq.user).toEqual({ id: "user-1", role: "USER" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next with error if token is missing", () => {
      vi.mocked(extractToken).mockReturnValue(undefined);

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Authentication token missing" }),
      );
    });

    it("should call next with error if verifyToken throws", () => {
      vi.mocked(extractToken).mockReturnValue("invalid-token");
      const error = new Error("Invalid token");
      vi.mocked(verifyToken).mockImplementation(() => {
        throw error;
      });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("optionalAuth", () => {
    it("should set req.user and call next if token is valid", () => {
      vi.mocked(extractToken).mockReturnValue("valid-token");
      vi.mocked(verifyToken).mockReturnValue({ id: "user-1", role: "USER" });

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({ id: "user-1", role: "USER" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next without error if token is missing", () => {
      vi.mocked(extractToken).mockReturnValue(undefined);

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next without error if verifyToken throws", () => {
      vi.mocked(extractToken).mockReturnValue("invalid-token");
      vi.mocked(verifyToken).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
