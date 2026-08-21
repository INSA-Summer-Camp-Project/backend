import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { generateRandomToken, hashToken } from "@/utils/crypto.util";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

describe("Auth Refresh & Logout", () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        telegramId: "tg_test_refresh",
        systemRole: "USER",
        customerProfile: { create: {} },
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("should successfully refresh tokens and rotate", async () => {
    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();

    const accessCookie = cookies.find((c: string) =>
      c.startsWith("access_token="),
    );
    const refreshCookie = cookies.find((c: string) =>
      c.startsWith("refresh_token="),
    );

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    // Verify the old token was revoked
    const oldToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    expect(oldToken?.revokedAt).not.toBeNull();
  });

  it("should reject an expired refresh token", async () => {
    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Expired
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(response.status).toBe(401);
  });

  it("should reject a revoked refresh token", async () => {
    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(), // Revoked
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(response.status).toBe(401);
  });

  it("should revoke refresh token on logout", async () => {
    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = jwt.sign(
      { id: testUserId, role: "USER" },
      env.JWT_SECRET,
    );

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const cookies = response.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookies.find((c: string) =>
      c.startsWith("refresh_token="),
    );
    expect(refreshCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);

    // Verify revoked in DB
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    expect(token?.revokedAt).not.toBeNull();
  });
});
