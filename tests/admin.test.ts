import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";

describe("Admin Integration Tests (/api/v1/admin)", () => {
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
      name: "Admin Test",
      telegramId: "tg_admin_test",
      systemRole: "ADMIN",
    });
    adminToken = (await generateTokens(admin.id, "ADMIN")).accessToken;

    const user = await registerUser({
      name: "Regular User",
      telegramId: "tg_regular_user",
      systemRole: "USER",
    });
    userToken = (await generateTokens(user.id, "USER")).accessToken;
  });

  it("GET /api/v1/admin/stats should return dashboard stats", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("totalUsers");
    expect(res.body.data).toHaveProperty("totalJobs");
    expect(res.body.data).toHaveProperty("totalPaymentVolume");
  });

  it("GET /api/v1/admin/stats should forbid non-admin users", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("GET /api/v1/admin/users should return paginated users", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty("total");
  });

  it("POST /api/v1/admin/categories should create a category", async () => {
    const res = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Admin Category" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Admin Category");
  });

  it("POST /api/v1/admin/categories should reject duplicate name", async () => {
    await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dup Category" });

    const res = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dup Category" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("DELETE /api/v1/admin/categories/:id should delete a category", async () => {
    const cat = await prisma.category.create({
      data: { name: "To Delete" },
    });

    const res = await request(app)
      .delete(`/api/v1/admin/categories/${cat.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(deleted).toBeNull();
  });
});
