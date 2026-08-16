/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeEach, vi } from "vitest";

const mockVerify = vi.fn();

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mockVerify,
    JsonWebTokenError: class extends Error {},
    TokenExpiredError: class extends Error {},
  },
}));

vi.mock("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
  },
}));

import { authenticate } from "@/middlewares/auth.middleware";

describe("auth.middleware - authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMocks = (overrides: any = {}) => {
    const req = {
      headers: {},
      ...overrides,
    } as any;

    const res = {} as any;

    const next = vi.fn();

    return {
      req,
      res,
      next,
    };
  };

  it("should authenticate using Bearer token", () => {
    mockVerify.mockReturnValue({
      id: "user-123",
      role: "CUSTOMER",
    });

    const { req, res, next } = createMocks({
      headers: {
        authorization: "Bearer access-token",
      },
    });

    authenticate(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith("access-token", "test-secret");

    expect(req.user).toEqual({
      id: "user-123",
      role: "CUSTOMER",
    });

    expect(next).toHaveBeenCalledWith();
  });

  it("should authenticate using access_token cookie", () => {
    mockVerify.mockReturnValue({
      id: "user-123",
      role: "CUSTOMER",
    });

    const { req, res, next } = createMocks({
      headers: {
        cookie: "access_token=cookie-token",
      },
    });

    authenticate(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith("cookie-token", "test-secret");

    expect(req.user).toEqual({
      id: "user-123",
      role: "CUSTOMER",
    });

    expect(next).toHaveBeenCalledWith();
  });

  it("should prefer Bearer token over cookie", () => {
    mockVerify.mockReturnValue({
      id: "user-123",
      role: "CUSTOMER",
    });

    const { req, res, next } = createMocks({
      headers: {
        authorization: "Bearer bearer-token",
        cookie: "access_token=cookie-token",
      },
    });

    authenticate(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith("bearer-token", "test-secret");
  });

  it("should reject requests without authentication", () => {
    const { req, res, next } = createMocks();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication token missing",
      }),
    );
  });

  it("should reject invalid JWT", () => {
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const { req, res, next } = createMocks({
      headers: {
        authorization: "Bearer invalid-token",
      },
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
