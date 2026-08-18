import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { extractToken } from "@/lib/auth/extract-token";

describe("extractToken", () => {
  it("should extract token from Bearer header", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer my-secret-token",
      },
    } as Partial<Request>;

    const token = extractToken(mockReq as Request);
    expect(token).toBe("my-secret-token");
  });

  it("should extract token from cookie if Bearer header is missing", () => {
    const mockReq = {
      headers: {
        cookie: "other_cookie=123; access_token=my-cookie-token",
      },
    } as Partial<Request>;

    const token = extractToken(mockReq as Request);
    expect(token).toBe("my-cookie-token");
  });

  it("should return undefined if no token in header or cookie", () => {
    const mockReq = {
      headers: {},
    } as Partial<Request>;

    const token = extractToken(mockReq as Request);
    expect(token).toBeUndefined();
  });

  it("should return undefined if authorization header does not start with Bearer", () => {
    const mockReq = {
      headers: {
        authorization: "Basic credentials",
      },
    } as Partial<Request>;

    const token = extractToken(mockReq as Request);
    expect(token).toBeUndefined();
  });
});
