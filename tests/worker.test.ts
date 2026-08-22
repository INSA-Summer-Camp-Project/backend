import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";
import type { UserPublicDto } from "@/dtos/auth.dto";

describe("Worker Profile & Catalog Integration Tests (/api/v1/workers)", () => {
  let workerAToken: string;
  let workerAUser: UserPublicDto;
  let workerBToken: string;
  let workerBUser: UserPublicDto;
  let categoryId: string;

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

    // Create Category
    const category = await prisma.category.create({
      data: { name: "Plumbing", description: "All plumbing services" },
    });
    categoryId = category.id;

    // Worker A
    workerAUser = await registerUser({
      name: "Worker Alice",
      telegramId: "tg_worker_a",
      role: "WORKER",
    });
    workerAToken = (await generateTokens(workerAUser.id, "USER")).accessToken;

    // Worker B
    workerBUser = await registerUser({
      name: "Worker Bob",
      telegramId: "tg_worker_b",
      role: "WORKER",
    });
    workerBToken = (await generateTokens(workerBUser.id, "USER")).accessToken;
  });

  describe("Worker Profile Endpoints", () => {
    it("GET /api/v1/workers/me should return authenticated worker's profile", async () => {
      const res = await request(app)
        .get("/api/v1/workers/me")
        .set("Authorization", `Bearer ${workerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(workerAUser.id);
      expect(res.body.data.services).toEqual([]);
      expect(res.body.data.portfolios).toEqual([]);
      expect(res.body.data.certificates).toEqual([]);
    });

    it("PUT /api/v1/workers/me should update worker profile details", async () => {
      const res = await request(app)
        .put("/api/v1/workers/me")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          bio: "Expert plumber with 5 years experience",
          experienceYears: 5,
          availability: "Mon-Fri 9am-5pm",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe("Expert plumber with 5 years experience");
      expect(res.body.data.experienceYears).toBe(5);
    });

    it("GET /api/v1/workers/:id should return public profile of a worker", async () => {
      const workerId = workerAUser.worker!.id;

      const res = await request(app).get(`/api/v1/workers/${workerId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(workerId);
      expect(res.body.data.user.name).toBe("Worker Alice");
    });
  });

  describe("Worker Services / Skills Endpoints", () => {
    it("POST /api/v1/workers/me/services should create a new service offering", async () => {
      const res = await request(app)
        .post("/api/v1/workers/me/services")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          categoryId,
          name: "Leak Repair",
          description: "Fix leaking pipes and taps",
          price: 50.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Leak Repair");
      expect(res.body.data.category.id).toBe(categoryId);
    });

    it("PUT /api/v1/workers/me/services/:serviceId should update owned service", async () => {
      const serviceRes = await request(app)
        .post("/api/v1/workers/me/services")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          categoryId,
          name: "Pipe Repair",
        });

      const serviceId = serviceRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/workers/me/services/${serviceId}`)
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          name: "Pipe Repair & Fitting",
          price: 75.0,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.name).toBe("Pipe Repair & Fitting");
    });

    it("DELETE /api/v1/workers/me/services/:serviceId should delete owned service", async () => {
      const serviceRes = await request(app)
        .post("/api/v1/workers/me/services")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({ categoryId, name: "Temporary Service" });

      const serviceId = serviceRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/v1/workers/me/services/${serviceId}`)
        .set("Authorization", `Bearer ${workerAToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });

    it("Ownership Security: Worker B cannot modify or delete Worker A's service", async () => {
      const serviceRes = await request(app)
        .post("/api/v1/workers/me/services")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({ categoryId, name: "Worker A Service" });

      const serviceId = serviceRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/workers/me/services/${serviceId}`)
        .set("Authorization", `Bearer ${workerBToken}`)
        .send({ name: "Hacked Service Name" });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);

      const delRes = await request(app)
        .delete(`/api/v1/workers/me/services/${serviceId}`)
        .set("Authorization", `Bearer ${workerBToken}`);

      expect(delRes.status).toBe(403);
      expect(delRes.body.success).toBe(false);
    });
  });

  describe("Worker Portfolios & Certificates Endpoints", () => {
    it("POST & DELETE /api/v1/workers/me/portfolios should manage portfolio items", async () => {
      const createRes = await request(app)
        .post("/api/v1/workers/me/portfolios")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          title: "Bathroom Renovation",
          description: "Complete modern piping",
          imageUrl: "https://example.com/images/bath.jpg",
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const portfolioId = createRes.body.data.id;

      // Security check: Worker B cannot delete Worker A's portfolio
      const forbiddenDel = await request(app)
        .delete(`/api/v1/workers/me/portfolios/${portfolioId}`)
        .set("Authorization", `Bearer ${workerBToken}`);

      expect(forbiddenDel.status).toBe(403);

      // Owner deletes portfolio
      const delRes = await request(app)
        .delete(`/api/v1/workers/me/portfolios/${portfolioId}`)
        .set("Authorization", `Bearer ${workerAToken}`);

      expect(delRes.status).toBe(200);
    });

    it("POST & DELETE /api/v1/workers/me/certificates should manage certificates", async () => {
      const createRes = await request(app)
        .post("/api/v1/workers/me/certificates")
        .set("Authorization", `Bearer ${workerAToken}`)
        .send({
          title: "Master Plumber License",
          fileUrl: "https://example.com/files/license.pdf",
          issuedDate: "2023-05-15",
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const certId = createRes.body.data.id;

      // Security check: Worker B cannot delete Worker A's certificate
      const forbiddenDel = await request(app)
        .delete(`/api/v1/workers/me/certificates/${certId}`)
        .set("Authorization", `Bearer ${workerBToken}`);

      expect(forbiddenDel.status).toBe(403);

      // Owner deletes certificate
      const delRes = await request(app)
        .delete(`/api/v1/workers/me/certificates/${certId}`)
        .set("Authorization", `Bearer ${workerAToken}`);

      expect(delRes.status).toBe(200);
    });
  });

  describe("Worker Search Sorting & Reputation Earnings", () => {
    it("GET /api/v1/workers?sortBy=jobs should sort workers by completed jobs count", async () => {
      // Create a customer and jobs assigned to Worker A
      const customer = await registerUser({
        name: "Customer John",
        telegramId: "tg_cust_sort",
      });
      const custProfile = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: customer.id },
      });

      const workerA = await prisma.worker.findUniqueOrThrow({
        where: { userId: workerAUser.id },
      });

      // Worker A gets 2 jobs
      await prisma.job.create({
        data: {
          customerId: custProfile.id,
          categoryId,
          title: "Job 1 for A",
          description: "Detailed description for job 1",
          budget: 500,
          status: "COMPLETED",
          assignedWorkerId: workerA.id,
        },
      });
      await prisma.job.create({
        data: {
          customerId: custProfile.id,
          categoryId,
          title: "Job 2 for A",
          description: "Detailed description for job 2",
          budget: 600,
          status: "COMPLETED",
          assignedWorkerId: workerA.id,
        },
      });

      const res = await request(app)
        .get("/api/v1/workers?sortBy=jobs")
        .set("Authorization", `Bearer ${workerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].id).toBe(workerA.id);
    });

    it("GET /api/v1/workers/:id/reputation should compute totalEarnings from actual PAID payments", async () => {
      const customer = await registerUser({
        name: "Customer Bob",
        telegramId: "tg_cust_earn",
      });
      const custProfile = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: customer.id },
      });
      const workerA = await prisma.worker.findUniqueOrThrow({
        where: { userId: workerAUser.id },
      });

      const job = await prisma.job.create({
        data: {
          customerId: custProfile.id,
          categoryId,
          title: "Job Paid",
          description: "Detailed description for paid job",
          budget: 1000,
          status: "COMPLETED",
          assignedWorkerId: workerA.id,
        },
      });

      await prisma.payment.create({
        data: {
          jobId: job.id,
          amount: 850,
          currency: "ETB",
          method: "CHAPA",
          status: "PAID",
          txRef: `sh_earn_${Date.now()}`,
          platformCommission: 85,
        },
      });

      const res = await request(app).get(`/api/v1/workers/${workerA.id}/reputation`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalEarnings).toBe(850);
    });
  });
});
