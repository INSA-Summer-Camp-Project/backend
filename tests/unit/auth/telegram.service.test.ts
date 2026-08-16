/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockBuildAuthorizationUrl,
  mockAuthorizationCodeGrant,
  mockGetTelegramConfiguration,
} = vi.hoisted(() => ({
  mockBuildAuthorizationUrl: vi.fn(),
  mockAuthorizationCodeGrant: vi.fn(),
  mockGetTelegramConfiguration: vi.fn(),
}));

vi.mock("openid-client", () => ({
  buildAuthorizationUrl: mockBuildAuthorizationUrl,
  authorizationCodeGrant: mockAuthorizationCodeGrant,
}));

vi.mock("@/lib/telegram-oidc", () => ({
  getTelegramConfiguration: mockGetTelegramConfiguration,
}));

vi.mock("@/config/env", () => ({
  env: {
    TELEGRAM_CLIENT_ID: "test-client-id",
    TELEGRAM_CLIENT_SECRET: "test-client-secret",
    TELEGRAM_REDIRECT_URI: "http://localhost:3000/api/auth/telegram/callback",
  },
}));

import {
  createAuthorizationUrl,
  handleCallback,
} from "@/services/telegram.service";

describe("telegram.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetTelegramConfiguration.mockResolvedValue({
      issuer: "https://oauth.telegram.org",
    });
  });

  describe("createAuthorizationUrl", () => {
    it("should build Telegram authorization URL with required OIDC parameters", async () => {
      const expectedUrl = new URL("https://oauth.telegram.org/auth?test=true");

      mockBuildAuthorizationUrl.mockReturnValue(expectedUrl);

      const result = await createAuthorizationUrl(
        "test-state",
        "test-code-challenge",
        "test-nonce",
      );

      expect(result).toBe(expectedUrl);

      expect(mockGetTelegramConfiguration).toHaveBeenCalledOnce();

      expect(mockBuildAuthorizationUrl).toHaveBeenCalledWith(
        { issuer: "https://oauth.telegram.org" },
        {
          redirect_uri: "http://localhost:3000/api/auth/telegram/callback",
          response_type: "code",
          scope: "openid profile",
          state: "test-state",
          nonce: "test-nonce",
          code_challenge: "test-code-challenge",
          code_challenge_method: "S256",
        },
      );
    });

    it("should use the provided state", async () => {
      mockBuildAuthorizationUrl.mockReturnValue(
        new URL("https://telegram.test"),
      );

      await createAuthorizationUrl("unique-state", "challenge", "nonce");

      const [, options] = mockBuildAuthorizationUrl.mock.calls[0] as any;

      expect(options.state).toBe("unique-state");
    });

    it("should use S256 PKCE", async () => {
      mockBuildAuthorizationUrl.mockReturnValue(
        new URL("https://telegram.test"),
      );

      await createAuthorizationUrl("state", "challenge", "nonce");

      const [, options] = mockBuildAuthorizationUrl.mock.calls[0] as any;

      expect(options.code_challenge_method).toBe("S256");
    });
  });

  describe("handleCallback", () => {
    it("should exchange authorization code and return Telegram identity", async () => {
      const claims = vi.fn().mockReturnValue({
        sub: "telegram-sub-123",
        id: 123456789,
        name: "Bella",
        preferred_username: "bella",
        picture: "https://example.com/photo.jpg",
        phone_number: "+251900000000",
      });

      mockAuthorizationCodeGrant.mockResolvedValue({
        id_token: "telegram-id-token",
        claims,
      });

      const callbackUrl = new URL(
        "http://localhost:3000/api/auth/telegram/callback?code=abc&state=xyz",
      );

      const result = await handleCallback(
        callbackUrl,
        "expected-state",
        "expected-verifier",
        "expected-nonce",
      );

      expect(mockAuthorizationCodeGrant).toHaveBeenCalledWith(
        { issuer: "https://oauth.telegram.org" },
        callbackUrl,
        {
          pkceCodeVerifier: "expected-verifier",
          expectedState: "expected-state",
          expectedNonce: "expected-nonce",
          idTokenExpected: true,
        },
      );

      expect(result).toEqual({
        sub: "telegram-sub-123",
        id: 123456789,
        name: "Bella",
        preferred_username: "bella",
        picture: "https://example.com/photo.jpg",
        phone_number: "+251900000000",
      });
    });

    it("should return only claims that actually exist", async () => {
      const claims = vi.fn().mockReturnValue({
        sub: "telegram-sub-123",
        name: "Bella",
      });

      mockAuthorizationCodeGrant.mockResolvedValue({
        id_token: "telegram-id-token",
        claims,
      });

      const result = await handleCallback(
        new URL("http://localhost:3000/callback?code=abc&state=xyz"),
        "state",
        "verifier",
        "nonce",
      );

      expect(result).toEqual({
        sub: "telegram-sub-123",
        name: "Bella",
      });

      expect("id" in result).toBe(false);

      expect("preferred_username" in result).toBe(false);

      expect("picture" in result).toBe(false);

      expect("phone_number" in result).toBe(false);
    });

    it("should throw when ID token is missing", async () => {
      mockAuthorizationCodeGrant.mockResolvedValue({
        id_token: undefined,
        claims: vi.fn(),
      });

      await expect(
        handleCallback(
          new URL("http://localhost:3000/callback"),
          "state",
          "verifier",
          "nonce",
        ),
      ).rejects.toThrow("Telegram did not return a valid ID token");
    });

    it("should throw when claims are missing", async () => {
      mockAuthorizationCodeGrant.mockResolvedValue({
        id_token: "token",
        claims: () => undefined,
      });

      await expect(
        handleCallback(
          new URL("http://localhost:3000/callback"),
          "state",
          "verifier",
          "nonce",
        ),
      ).rejects.toThrow("Telegram did not return a valid ID token");
    });

    it("should throw when sub is missing", async () => {
      mockAuthorizationCodeGrant.mockResolvedValue({
        id_token: "token",
        claims: () => ({
          name: "Bella",
        }),
      });

      await expect(
        handleCallback(
          new URL("http://localhost:3000/callback"),
          "state",
          "verifier",
          "nonce",
        ),
      ).rejects.toThrow("Telegram ID token is missing subject");
    });
  });
});
