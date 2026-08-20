import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { registerUser, generateTokens } from "@/services/auth.service";

describe("Category Integration Tests (/api/v1/categories)", () => {
  let adminToken: string;
  let userToken: string;

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

    const admin = await registerUser({
      name: "Admin User",
      telegramId: "tg_admin_cat",
      systemRole: "ADMIN",
    });
    adminToken = generateTokens(admin.id, "ADMIN").accessToken;

    const normalUser = await registerUser({
      name: "Normal User",
      telegramId: "tg_user_cat",
      systemRole: "USER",
    });
    userToken = generateTokens(normalUser.id, "USER").accessToken;
  });

  it("GET /api/v1/categories should return all categories publicly", async () => {
    await prisma.category.create({
      data: { name: "Cat_Plumbing_1", description: "Pipes and drains" },
    });
    await prisma.category.create({
      data: { name: "Cat_Electrical_1", description: "Wiring and power" },
    });

    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]._count).toBeDefined();
  });

  it("POST /api/v1/categories should allow Admin to create a category", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Cat_Carpentry_1",
        description: "Woodworking and furniture",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Cat_Carpentry_1");
  });

  it("POST /api/v1/categories should forbid non-admin users", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Cat_Gardening_1",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/categories should return 409 Conflict for duplicate category name", async () => {
    await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Cat_Painting_1" });

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Cat_Painting_1" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
