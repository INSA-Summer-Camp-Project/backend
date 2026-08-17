import { SystemRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { generateTokens } from "@/services/auth.service";

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked-jwt-token"),
  },
}));

describe("Auth Service", () => {
  describe("generateTokens", () => {
    it("should generate a valid access token and correctly assign roles", () => {
      const userId = "test-user-id";
      const role = SystemRole.USER;

      const result = generateTokens(userId, role);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
      );
      expect(result.accessToken).toBe("mocked-jwt-token");
    });
  });
});
