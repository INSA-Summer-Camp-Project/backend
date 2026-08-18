import * as oidc from "openid-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { getTelegramConfiguration } from "@/lib/telegram-oidc";
import * as telegramService from "@/services/telegram.service";

// Mock dependencies
vi.mock("openid-client", () => ({
  buildAuthorizationUrl: vi.fn(),
  authorizationCodeGrant: vi.fn(),
}));

vi.mock("@/lib/telegram-oidc", () => ({
  getTelegramConfiguration: vi.fn(),
}));

describe("Telegram Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuthorizationUrl", () => {
    it("should build auth url using openid-client", async () => {
      vi.mocked(getTelegramConfiguration).mockResolvedValue({} as never);
      vi.mocked(oidc.buildAuthorizationUrl).mockReturnValue(
        new URL("https://telegram.org/auth"),
      );

      const result = await telegramService.createAuthorizationUrl(
        "state123",
        "challenge",
        "nonce",
      );

      expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          redirect_uri: env.TELEGRAM_REDIRECT_URI,
          response_type: "code",
          scope: "openid profile",
          state: "state123",
          nonce: "nonce",
          code_challenge: "challenge",
          code_challenge_method: "S256",
        }),
      );
      expect(result.toString()).toBe("https://telegram.org/auth");
    });
  });

  describe("handleCallback", () => {
    it("should correctly parse and extract claims from OIDC token", async () => {
      vi.mocked(getTelegramConfiguration).mockResolvedValue({} as never);

      const mockClaims = {
        sub: "user-1",
        id: 12345,
        name: "John Doe",
        preferred_username: "johndoe",
        picture: "https://pic.com/1",
      };

      vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
        claims: () => mockClaims,
      } as never);

      const url = new URL("https://example.com/callback?code=abc");
      const result = await telegramService.handleCallback(
        url,
        "state123",
        "verifier",
        "nonce",
      );

      expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith({}, url, {
        pkceCodeVerifier: "verifier",
        expectedState: "state123",
        expectedNonce: "nonce",
        idTokenExpected: true,
      });

      expect(result).toEqual({
        sub: "user-1",
        id: 12345,
        name: "John Doe",
        preferred_username: "johndoe",
        picture: "https://pic.com/1",
      });
    });

    it("should throw if sub claim is missing", async () => {
      vi.mocked(getTelegramConfiguration).mockResolvedValue({} as never);
      vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
        claims: () => ({ name: "John" }), // missing sub
      } as never);

      const url = new URL("https://example.com/callback?code=abc");
      await expect(
        telegramService.handleCallback(url, "state", "verifier", "nonce"),
      ).rejects.toThrow("Telegram ID token is missing subject");
    });
  });
});
