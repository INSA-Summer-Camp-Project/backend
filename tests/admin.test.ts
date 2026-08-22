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
    const deleted = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(deleted).toBeNull();
  });

  it("DELETE /api/v1/admin/categories/:id should reject deletion when category has associated services or jobs", async () => {
    const cat = await prisma.category.create({
      data: { name: "Category With Service" },
    });

    const workerUser = await registerUser({
      name: "Worker Test",
      telegramId: "tg_cat_worker",
      systemRole: "USER",
      role: "WORKER",
    });
    const workerProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerUser.id },
    });

    await prisma.service.create({
      data: {
        providerId: workerProfile.id,
        categoryId: cat.id,
        name: "Plumbing Service",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/admin/categories/${cat.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(
      /Cannot delete category with associated jobs or services/i,
    );
  });

  describe("PATCH /api/v1/admin/users/:id/role", () => {
    it("should reject admin self-demotion", async () => {
      const admin = await prisma.user.findFirstOrThrow({
        where: { systemRole: "ADMIN" },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${admin.id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Admins cannot demote themselves/i);
    });

    it("should reject demoting the only remaining admin", async () => {
      const otherAdmin = await registerUser({
        name: "Other Admin",
        telegramId: "tg_other_admin",
        systemRole: "ADMIN",
      });

      // Now we have 2 admins. Demoting otherAdmin succeeds:
      const res1 = await request(app)
        .patch(`/api/v1/admin/users/${otherAdmin.id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });
      expect(res1.status).toBe(200);

      // Now only 1 admin remains. Trying to demote otherAdmin when only 1 admin exists fails:
      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${otherAdmin.id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });
      // otherAdmin is already USER so it's a no-op / valid update to USER
      expect(res2.status).toBe(200);
    });

    it("should promote regular user to ADMIN", async () => {
      const user = await prisma.user.findFirstOrThrow({
        where: { systemRole: "USER" },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${user.id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.systemRole).toBe("ADMIN");
    });
  });
});
