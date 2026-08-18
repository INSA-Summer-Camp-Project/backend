import { SystemRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import * as authService from "@/services/auth.service";

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked-jwt-token"),
  },
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    customerProfile: { create: vi.fn() },
    workerProfile: { create: vi.fn() },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("Auth Service", () => {
  describe("generateTokens", () => {
    it("should generate a valid access token and correctly assign roles", () => {
      const userId = "test-user-id";
      const role = SystemRole.USER;

      const result = authService.generateTokens(userId, role);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
      );
      expect(result.accessToken).toBe("mocked-jwt-token");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user if found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        name: "John",
      } as never);

      const result = await authService.getCurrentUser("user-1");
      expect(result.id).toBe("user-1");
    });

    it("should throw NotFoundError if user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.getCurrentUser("user-1")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("updateActiveRole", () => {
    it("should throw if user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.updateActiveRole("user-1", "WORKER"),
      ).rejects.toThrow("User not found");
    });

    it("should throw if switching to WORKER without worker profile", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        workerProfile: null,
      } as never);

      await expect(
        authService.updateActiveRole("user-1", "WORKER"),
      ).rejects.toThrow(
        "Cannot switch to WORKER role without a worker profile.",
      );
    });

    it("should successfully switch role", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        workerProfile: { id: "wp-1" },
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-1",
        lastActiveRole: "WORKER",
      } as never);

      const result = await authService.updateActiveRole("user-1", "WORKER");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { lastActiveRole: "WORKER" },
        select: expect.any(Object),
      });
      expect(result.lastActiveRole).toBe("WORKER");
    });
  });

  describe("loginWithTelegram", () => {
    it("should return tokens for existing user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        systemRole: "USER",
      } as never);

      const result = await authService.loginWithTelegram({ sub: "tel-123" });

      expect(result.user.id).toBe("user-1");
      expect(result.tokens.accessToken).toBe("mocked-jwt-token");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should create new user, profiles, and return tokens", async () => {
      // First findUnique returns null (user doesn't exist)
      // Second findUnique (inside tx) returns the new user
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "new-user", systemRole: "USER" } as never);

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user",
      } as never);

      const result = await authService.loginWithTelegram({
        sub: "tel-123",
        name: "Alice",
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: "Alice", telegramId: "tel-123", systemRole: "USER" },
      });
      expect(prisma.customerProfile.create).toHaveBeenCalledWith({
        data: { userId: "new-user" },
      });
      expect(prisma.workerProfile.create).toHaveBeenCalledWith({
        data: { userId: "new-user", bio: "", experience: "" },
      });
      expect(result.user.id).toBe("new-user");
      expect(result.tokens.accessToken).toBe("mocked-jwt-token");
    });

    it("should fallback to preferred_username then Telegram User if name missing", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "new-user", systemRole: "USER" } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user",
      } as never);

      await authService.loginWithTelegram({
        sub: "tel-123",
        preferred_username: "alice_uname",
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "alice_uname" }),
        }),
      );

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "new-user", systemRole: "USER" } as never);

      await authService.loginWithTelegram({ sub: "tel-124" });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Telegram User" }),
        }),
      );
    });
  });
});
