import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { verifyToken } from "@/lib/auth/verify-token";
import { UnauthorizedError } from "@/middlewares/error.middleware";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {},
  },
}));

describe("verifyToken", () => {
  it("should return decoded payload if valid", () => {
    vi.mocked(jwt.verify).mockReturnValue({
      id: "user-1",
      role: "USER",
    } as never);

    const result = verifyToken("valid-token");

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", env.JWT_SECRET);
    expect(result).toEqual({ id: "user-1", role: "USER" });
  });

  it("should throw UnauthorizedError if token payload missing id", () => {
    vi.mocked(jwt.verify).mockReturnValue({ role: "USER" } as never);

    expect(() => verifyToken("invalid-payload-token")).toThrow(
      UnauthorizedError,
    );
    expect(() => verifyToken("invalid-payload-token")).toThrow(
      "Invalid token payload",
    );
  });

  it("should throw UnauthorizedError if token payload missing role", () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: "user-1" } as never);

    expect(() => verifyToken("invalid-payload-token")).toThrow(
      UnauthorizedError,
    );
    expect(() => verifyToken("invalid-payload-token")).toThrow(
      "Invalid token payload",
    );
  });

  it("should throw UnauthorizedError if jwt.verify throws JsonWebTokenError", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new jwt.JsonWebTokenError("jwt expired");
    });

    expect(() => verifyToken("expired-token")).toThrow(UnauthorizedError);
    expect(() => verifyToken("expired-token")).toThrow(
      "Invalid or expired token",
    );
  });

  it("should rethrow other errors", () => {
    const error = new Error("Something else failed");
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw error;
    });

    expect(() => verifyToken("some-token")).toThrow(error);
  });
});
