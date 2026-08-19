import { stringifySetCookie } from "cookie";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { callback, login } from "@/controllers/telegram.controller";
import { UnauthorizedError } from "@/errors";
import {
  generateTelegramNonce,
  generateTelegramPkce,
  generateTelegramState,
} from "@/lib/telegram-oidc";
import {
  clearTelegramOidcTransaction,
  getTelegramOidcTransaction,
  setTelegramOidcTransaction,
} from "@/lib/telegram-oidc-cookie";
import * as authService from "@/services/auth.service";
import * as telegramService from "@/services/telegram.service";

// Mock utilities and services
vi.mock("@/lib/telegram-oidc", () => ({
  generateTelegramState: vi.fn(),
  generateTelegramNonce: vi.fn(),
  generateTelegramPkce: vi.fn(),
}));

vi.mock("@/lib/telegram-oidc-cookie", () => ({
  setTelegramOidcTransaction: vi.fn(),
  getTelegramOidcTransaction: vi.fn(),
  clearTelegramOidcTransaction: vi.fn(),
}));

vi.mock("@/services/auth.service", () => ({
  loginWithTelegram: vi.fn(),
}));

vi.mock("@/services/telegram.service", () => ({
  createAuthorizationUrl: vi.fn(),
  handleCallback: vi.fn(),
}));

vi.mock("cookie", () => ({
  stringifySetCookie: vi.fn(),
}));

describe("Telegram Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {
      redirect: vi.fn(),
      append: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should set transaction cookie and redirect to authorization URL", async () => {
      vi.mocked(generateTelegramState).mockReturnValue("mock-state");
      vi.mocked(generateTelegramNonce).mockReturnValue("mock-nonce");
      vi.mocked(generateTelegramPkce).mockResolvedValue({
        codeVerifier: "mock-verifier",
        codeChallenge: "mock-challenge",
      });
      vi.mocked(telegramService.createAuthorizationUrl).mockResolvedValue(
        new URL("https://telegram.org/auth"),
      );

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(setTelegramOidcTransaction).toHaveBeenCalledWith(mockRes, {
        state: "mock-state",
        codeVerifier: "mock-verifier",
        nonce: "mock-nonce",
      });
      expect(mockRes.redirect).toHaveBeenCalledWith(
        "https://telegram.org/auth",
      );
    });

    it("should call next with error if something fails", async () => {
      const error = new Error("Generation error");
      vi.mocked(generateTelegramState).mockImplementation(() => {
        throw error;
      });

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("callback", () => {
    it("should handle valid callback, set cookie and redirect to frontend", async () => {
      vi.mocked(getTelegramOidcTransaction).mockReturnValue({
        state: "mock-state",
        codeVerifier: "mock-verifier",
        nonce: "mock-nonce",
      });

      mockReq.query = { code: "123", state: "mock-state" };

      const mockIdentity = { sub: "123", name: "Alice" };
      vi.mocked(telegramService.handleCallback).mockResolvedValue(
        mockIdentity as never,
      );

      const mockResult = { tokens: { accessToken: "jwt-token" } };
      vi.mocked(authService.loginWithTelegram).mockResolvedValue(
        mockResult as never,
      );

      vi.mocked(stringifySetCookie).mockReturnValue("access_token=jwt-token");

      await callback(mockReq as Request, mockRes as Response, mockNext);

      expect(telegramService.handleCallback).toHaveBeenCalledWith(
        expect.any(URL),
        "mock-state",
        "mock-verifier",
        "mock-nonce",
      );
      expect(authService.loginWithTelegram).toHaveBeenCalledWith(mockIdentity);
      expect(clearTelegramOidcTransaction).toHaveBeenCalledWith(mockRes);
      expect(mockRes.append).toHaveBeenCalledWith(
        "Set-Cookie",
        "access_token=jwt-token",
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(env.FRONTEND_URL);
    });

    it("should throw UnauthorizedError if transaction cookie is missing", async () => {
      vi.mocked(getTelegramOidcTransaction).mockReturnValue(null);

      await callback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should call next with error if service throws", async () => {
      vi.mocked(getTelegramOidcTransaction).mockReturnValue({
        state: "mock-state",
        codeVerifier: "mock-verifier",
        nonce: "mock-nonce",
      });

      const error = new Error("Auth failed");
      vi.mocked(telegramService.handleCallback).mockRejectedValue(error);

      await callback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
