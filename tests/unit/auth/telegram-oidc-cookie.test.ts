/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
    TELEGRAM_OIDC_COOKIE_SECRET:
      "this-is-a-test-secret-with-more-than-32-characters",
  },
}));

import {
  setTelegramOidcTransaction,
  getTelegramOidcTransaction,
  clearTelegramOidcTransaction,
} from "@/lib/telegram-oidc-cookie";

describe("telegram-oidc-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should store and retrieve an OIDC transaction", () => {
    const headers: string[] = [];

    const response = {
      append: vi.fn((name: string, value: string) => {
        if (name === "Set-Cookie") {
          headers.push(value);
        }
      }),
    } as any;

    setTelegramOidcTransaction(response, {
      state: "state-123",
      codeVerifier: "verifier-123",
      nonce: "nonce-123",
    });

    expect(headers).toHaveLength(1);

    const cookie = headers[0];

    expect(cookie).toContain("telegram_oidc_transaction=");

    const cookieHeader = cookie!.split(";")[0];

    const req = {
      headers: {
        cookie: cookieHeader,
      },
    } as any;

    const transaction = getTelegramOidcTransaction(req);

    expect(transaction).toEqual({
      state: "state-123",
      codeVerifier: "verifier-123",
      nonce: "nonce-123",
    });
  });

  it("should reject a tampered cookie", () => {
    const headers: string[] = [];

    const response = {
      append: vi.fn((name: string, value: string) => {
        if (name === "Set-Cookie") {
          headers.push(value);
        }
      }),
    } as any;

    setTelegramOidcTransaction(response, {
      state: "original-state",
      codeVerifier: "verifier",
      nonce: "nonce",
    });

    const cookie = headers[0]!.split(";")[0];

    const tamperedCookie = cookie!.replace("original-state", "attacker-state");

    const req = {
      headers: {
        cookie: tamperedCookie,
      },
    } as any;

    const result = getTelegramOidcTransaction(req);

    expect(result).toBeNull();
  });

  it("should return null when cookie is missing", () => {
    const req = {
      headers: {},
    } as any;

    expect(getTelegramOidcTransaction(req)).toBeNull();
  });

  it("should return null for malformed cookie", () => {
    const req = {
      headers: {
        cookie: "telegram_oidc_transaction=garbage",
      },
    } as any;

    expect(getTelegramOidcTransaction(req)).toBeNull();
  });

  it("should clear the OIDC transaction cookie", () => {
    const response = {
      append: vi.fn(),
    } as any;

    clearTelegramOidcTransaction(response);

    expect(response.append).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringContaining("telegram_oidc_transaction="),
    );

    expect(response.append.mock.calls[0][1]).toContain("Max-Age=0");
  });
});
