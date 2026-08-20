import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { getMe, logout, updateRole } from "@/controllers/auth.controller";
import type { UpdateRoleDto } from "@/dtos/auth.dto";
import * as authService from "@/services/auth.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/auth.service", () => ({
  getCurrentUser: vi.fn(),
  updateActiveRole: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Auth Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: "user-1", role: "USER" } as never,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      clearCookie: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("getMe", () => {
    it("should fetch current user and send success response", async () => {
      const mockUser = { id: "user-1", name: "Alice" };
      vi.mocked(authService.getCurrentUser).mockResolvedValue(
        mockUser as never,
      );

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.getCurrentUser).toHaveBeenCalledWith("user-1");
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockUser);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("User not found");
      vi.mocked(authService.getCurrentUser).mockRejectedValue(error);

      getMe(mockReq as Request, mockRes as Response, mockNext);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateRole", () => {
    it("should update active role and send success response", async () => {
      mockReq.body = { activeRole: "WORKER" };
      const mockUser = { id: "user-1", lastActiveRole: "WORKER" };
      vi.mocked(authService.updateActiveRole).mockResolvedValue(
        mockUser as never,
      );

      await updateRole(
        mockReq as Request<Record<string, string>, unknown, UpdateRoleDto>,
        mockRes as Response,
        mockNext,
      );

      expect(authService.updateActiveRole).toHaveBeenCalledWith(
        "user-1",
        "WORKER",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockUser);
    });
  });

  describe("logout", () => {
    it("should clear cookie and send success response", async () => {
      const isProduction = env.NODE_ENV === "production";

      await logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("access_token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
      });
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, {
        message: "Logged out successfully",
      });
    });
  });
});
