/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGenerateState,
  mockGenerateNonce,
  mockGeneratePkce,
  mockCreateAuthorizationUrl,
  mockSetTransaction,
  mockGetTransaction,
  mockClearTransaction,
  mockHandleCallback,
  mockLoginWithTelegram,
} = vi.hoisted(() => ({
  mockGenerateState: vi.fn(),
  mockGenerateNonce: vi.fn(),
  mockGeneratePkce: vi.fn(),
  mockCreateAuthorizationUrl: vi.fn(),
  mockSetTransaction: vi.fn(),
  mockGetTransaction: vi.fn(),
  mockClearTransaction: vi.fn(),
  mockHandleCallback: vi.fn(),
  mockLoginWithTelegram: vi.fn(),
}));

vi.mock("@/lib/telegram-oidc", () => ({
  generateTelegramState: mockGenerateState,
  generateTelegramNonce: mockGenerateNonce,
  generateTelegramPkce: mockGeneratePkce,
}));

vi.mock("@/lib/telegram-oidc-cookie", () => ({
  setTelegramOidcTransaction: mockSetTransaction,
  getTelegramOidcTransaction: mockGetTransaction,
  clearTelegramOidcTransaction: mockClearTransaction,
}));

vi.mock("@/services/telegram.service", () => ({
  createAuthorizationUrl: mockCreateAuthorizationUrl,
  handleCallback: mockHandleCallback,
}));

vi.mock("@/services/auth.service", () => ({
  loginWithTelegram: mockLoginWithTelegram,
}));

vi.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
    TELEGRAM_REDIRECT_URI: "http://localhost:3000/api/auth/telegram/callback",
    FRONTEND_URL: "http://localhost:3001",
  },
}));

import * as controller from "@/controllers/telegram.controller";

describe("telegram.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateState.mockReturnValue("state-123");

    mockGenerateNonce.mockReturnValue("nonce-123");

    mockGeneratePkce.mockResolvedValue({
      codeVerifier: "verifier-123",
      codeChallenge: "challenge-123",
    });

    mockCreateAuthorizationUrl.mockResolvedValue(
      new URL("https://oauth.telegram.org/auth?client_id=test"),
    );
  });

  describe("login", () => {
    it("should redirect the user to Telegram", async () => {
      const req = {} as any;

      const res = {
        redirect: vi.fn(),
      } as any;

      const next = vi.fn();

      await controller.login(req, res, next);

      expect(mockGenerateState).toHaveBeenCalledOnce();

      expect(mockGenerateNonce).toHaveBeenCalledOnce();

      expect(mockGeneratePkce).toHaveBeenCalledOnce();

      expect(mockSetTransaction).toHaveBeenCalledWith(res, {
        state: "state-123",
        codeVerifier: "verifier-123",
        nonce: "nonce-123",
      });

      expect(mockCreateAuthorizationUrl).toHaveBeenCalledWith(
        "state-123",
        "challenge-123",
        "nonce-123",
      );

      expect(res.redirect).toHaveBeenCalledWith(
        "https://oauth.telegram.org/auth?client_id=test",
      );

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass errors to Express error middleware", async () => {
      const error = new Error("Telegram unavailable");

      mockCreateAuthorizationUrl.mockRejectedValue(error);

      const req = {} as any;
      const res = {
        redirect: vi.fn(),
      } as any;

      const next = vi.fn();

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("callback", () => {
    it("should authenticate the Telegram user and redirect to frontend", async () => {
      mockGetTransaction.mockReturnValue({
        state: "state-123",
        codeVerifier: "verifier-123",
        nonce: "nonce-123",
      });

      mockHandleCallback.mockResolvedValue({
        sub: "telegram-123",
        name: "Bella",
        preferred_username: "bella",
      });

      mockLoginWithTelegram.mockResolvedValue({
        user: {
          id: "user-123",
          role: "CUSTOMER",
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      });

      const req = {
        query: {
          code: "authorization-code",
          state: "state-123",
        },
      } as any;

      const res = {
        append: vi.fn(),
        redirect: vi.fn(),
      } as any;

      const next = vi.fn();

      await controller.callback(req, res, next);

      expect(mockHandleCallback).toHaveBeenCalledWith(
        expect.any(URL),
        "state-123",
        "verifier-123",
        "nonce-123",
      );

      expect(mockLoginWithTelegram).toHaveBeenCalledWith({
        sub: "telegram-123",
        name: "Bella",
        preferred_username: "bella",
      });

      expect(mockClearTransaction).toHaveBeenCalledWith(res);

      expect(res.append).toHaveBeenCalled();

      expect(res.redirect).toHaveBeenCalledWith("http://localhost:3001");
    });

    it("should reject an expired OIDC transaction", async () => {
      mockGetTransaction.mockReturnValue(null);

      const req = {
        query: {},
      } as any;

      const res = {
        append: vi.fn(),
        redirect: vi.fn(),
      } as any;

      const next = vi.fn();

      await controller.callback(req, res, next);

      expect(next).toHaveBeenCalled();

      expect(mockHandleCallback).not.toHaveBeenCalled();

      expect(mockLoginWithTelegram).not.toHaveBeenCalled();
    });

    it("should pass Telegram validation errors to error middleware", async () => {
      mockGetTransaction.mockReturnValue({
        state: "state-123",
        codeVerifier: "verifier-123",
        nonce: "nonce-123",
      });

      const error = new Error("Invalid authorization response");

      mockHandleCallback.mockRejectedValue(error);

      const req = {
        query: {
          code: "bad-code",
          state: "state-123",
        },
      } as any;

      const res = {
        append: vi.fn(),
        redirect: vi.fn(),
      } as any;

      const next = vi.fn();

      await controller.callback(req, res, next);

      expect(next).toHaveBeenCalledWith(error);

      expect(mockLoginWithTelegram).not.toHaveBeenCalled();
    });
  });
});
