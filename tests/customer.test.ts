import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";

describe("Customer Profile Integration Tests (/api/v1/customers)", () => {
  let customerToken: string;
  let customerUserId: string;
  let customerProfileId: string;
  let workerToken: string;
  let workerUserId: string;

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

    // Create Customer
    const customer = await registerUser({
      name: "Alice Customer",
      telegramId: "tg_alice_customer",
      systemRole: "USER",
      role: "CUSTOMER",
    });
    customerUserId = customer.id;
    customerToken = (await generateTokens(customer.id, "USER")).accessToken;
    const profile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUserId },
    });
    customerProfileId = profile.id;

    // Create Worker
    const worker = await registerUser({
      name: "Bob Worker",
      telegramId: "tg_bob_worker",
      systemRole: "USER",
      role: "WORKER",
    });
    workerUserId = worker.id;
    workerToken = (await generateTokens(worker.id, "USER")).accessToken;
  });

  describe("GET /api/v1/customers/me", () => {
    it("should return the authenticated customer's own profile", async () => {
      const res = await request(app)
        .get("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerProfileId);
      expect(res.body.data.user.name).toBe("Alice Customer");
      expect(res.body.data).toHaveProperty("totalJobsPosted");
      expect(res.body.data).toHaveProperty("totalCompletedJobs");
    });

    it("should reject access when active role is WORKER", async () => {
      const res = await request(app)
        .get("/api/v1/customers/me")
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/v1/customers/me");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/v1/customers/me", () => {
    it("should update the customer's bio and profilePhoto", async () => {
      const res = await request(app)
        .put("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bio: "Looking for reliable home maintenance specialists.",
          profilePhoto: "https://example.com/customer-photo.jpg",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe(
        "Looking for reliable home maintenance specialists.",
      );
      expect(res.body.data.profilePhoto).toBe(
        "https://example.com/customer-photo.jpg",
      );

      const dbProfile = await prisma.customerProfile.findUnique({
        where: { id: customerProfileId },
      });
      expect(dbProfile?.bio).toBe(
        "Looking for reliable home maintenance specialists.",
      );
      expect(dbProfile?.profilePhoto).toBe(
        "https://example.com/customer-photo.jpg",
      );
    });
  });

  describe("GET /api/v1/customers/:id", () => {
    it("should return public customer profile with job stats", async () => {
      const res = await request(app).get(
        `/api/v1/customers/${customerProfileId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerProfileId);
      expect(res.body.data.user.name).toBe("Alice Customer");
      expect(res.body.data).toHaveProperty("totalJobsPosted");
      expect(res.body.data).toHaveProperty("reviews");
    });

    it("should return 404 for non-existent customer profile", async () => {
      const res = await request(app).get(
        "/api/v1/customers/00000000-0000-0000-0000-000000000000",
      );

      expect(res.status).toBe(404);
    });
  });
});
