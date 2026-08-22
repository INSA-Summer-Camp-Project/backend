import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";

describe("Onboarding Integration Tests (/api/v1/onboarding)", () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.user.deleteMany();

    const user = await registerUser({
      name: "Onboard User",
      telegramId: "tg_onboard_user",
      systemRole: "USER",
      isOnboarded: false,
    });
    userId = user.id;
    userToken = (await generateTokens(user.id, "USER")).accessToken;
  });

  it("GET /api/v1/onboarding should return onboarding status", async () => {
    const res = await request(app)
      .get("/api/v1/onboarding")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("hasCompletedOnboarding");
  });

  it("GET /api/v1/onboarding should require authentication", async () => {
    const res = await request(app).get("/api/v1/onboarding");
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/onboarding should complete onboarding as CUSTOMER", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveRole: null },
    });

    const res = await request(app)
      .post("/api/v1/onboarding")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ activeRole: "CUSTOMER" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveRole: true },
    });
    expect(updatedUser?.lastActiveRole).toBe("CUSTOMER");
  });

  it("POST /api/v1/onboarding should complete onboarding as WORKER", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveRole: null },
    });

    const res = await request(app)
      .post("/api/v1/onboarding")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ activeRole: "WORKER" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveRole: true },
    });
    expect(updatedUser?.lastActiveRole).toBe("WORKER");
  });

  it("POST /api/v1/onboarding should reject invalid activeRole", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveRole: null },
    });

    const res = await request(app)
      .post("/api/v1/onboarding")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ activeRole: "ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
