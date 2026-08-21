import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";
import type { UserPublicDto } from "@/dtos/auth.dto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function switchRole(
  userId: string,
  role: "CUSTOMER" | "WORKER",
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveRole: role },
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe("Phase 4 — Hiring System Integration Tests", () => {
  let customerUser: UserPublicDto;
  let customerToken: string;

  let workerUser: UserPublicDto;
  let workerToken: string;

  let workerBUser: UserPublicDto;
  let workerBToken: string;

  let categoryId: string;
  let workerId: string; // Worker.id (not User.id)

  beforeEach(async () => {
    // Wipe slate (respecting FK order)
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

    // Seed category
    const cat = await prisma.category.create({
      data: { name: `TestCat-${Date.now()}`, description: "Test" },
    });
    categoryId = cat.id;

    // Customer
    customerUser = await registerUser({
      name: "Alice Customer",
      role: "CUSTOMER",
    });
    await switchRole(customerUser.id, "CUSTOMER");
    customerToken = (await generateTokens(customerUser.id, "USER")).accessToken;

    // Worker A
    workerUser = await registerUser({
      name: "Bob Worker",
      role: "WORKER",
    });
    await switchRole(workerUser.id, "WORKER");
    workerToken = (await generateTokens(workerUser.id, "USER")).accessToken;
    workerId = workerUser.worker!.id;

    // Worker B
    workerBUser = await registerUser({
      name: "Carol Worker",
      role: "WORKER",
    });
    await switchRole(workerBUser.id, "WORKER");
    workerBToken = (await generateTokens(workerBUser.id, "USER")).accessToken;
  });

  // -------------------------------------------------------------------------
  // Module 1 — Job Postings
  // -------------------------------------------------------------------------
  describe("POST /api/v1/jobs — create marketplace posting", () => {
    it("Customer can create a marketplace posting", async () => {
      const res = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Need Plumbing Help",
          description: "Leaking pipe in the kitchen, urgent fix needed",
          budget: 150,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe("POSTING");
      expect(res.body.data.status).toBe("OPEN");
    });

    it("Worker cannot create a marketplace posting", async () => {
      const res = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({
          categoryId,
          title: "Need Plumbing Help",
          description: "Leaking pipe in the kitchen, urgent fix needed",
          budget: 150,
        });

      expect(res.status).toBe(403);
    });

    it("Validation: rejects postings with too-short title or description", async () => {
      const res = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Hi", // < 5 chars
          description: "Short",
          budget: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/jobs/direct — direct-hire booking", () => {
    it("Customer can create a direct booking for a valid worker", async () => {
      const res = await request(app)
        .post("/api/v1/jobs/direct")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          targetWorkerId: workerId,
          categoryId,
          title: "Direct Plumber Hire",
          description: "Kitchen pipe replacement needed urgently",
          budget: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.source).toBe("DIRECT");
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.targetWorker.id).toBe(workerId);
    });

    it("Anti-self-hire guard: customer cannot book their own worker profile", async () => {
      // Make the customer also a worker
      const workerProfile = await prisma.worker.create({
        data: { userId: customerUser.id, experienceYears: 0, ratingAvg: 0 },
      });

      const res = await request(app)
        .post("/api/v1/jobs/direct")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          targetWorkerId: workerProfile.id,
          categoryId,
          title: "Should Fail Self Hire",
          description: "This should be blocked by the anti-self-hire guard",
          budget: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/own worker/i);
    });
  });

  describe("GET /api/v1/jobs — public marketplace listing", () => {
    it("Returns only POSTING + OPEN jobs with pagination metadata", async () => {
      await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Electrical Wiring Job",
          description: "Complete house rewiring needed within the week",
          budget: 500,
        });

      const res = await request(app).get("/api/v1/jobs");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta).toHaveProperty("total");
      expect(res.body.meta).toHaveProperty("page");
    });

    it("Filters by categoryId", async () => {
      await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Filtered Category Job",
          description: "Looking for a professional to handle this task today",
          budget: 300,
        });

      const res = await request(app).get("/api/v1/jobs").query({ categoryId });

      expect(res.status).toBe(200);
      expect(
        res.body.data.every(
          (j: { categoryId: string }) => j.categoryId === categoryId,
        ),
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Module 2 — Applications / Bids
  // -------------------------------------------------------------------------
  describe("POST /api/v1/jobs/:jobId/apply — submit bid", () => {
    let jobId: string;

    beforeEach(async () => {
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Plumbing Work Required",
          description:
            "Need a certified plumber for a bathroom renovation done",
          budget: 400,
        });
      jobId = jobRes.body.data.id;
    });

    it("Worker can submit a bid on an OPEN marketplace job", async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 350, estimatedTime: "3 days" });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.proposedPrice).toBe("350");
    });

    it("Anti-self-bidding guard: customer cannot bid on their own job", async () => {
      const selfWorker = await prisma.worker.create({
        data: { userId: customerUser.id, experienceYears: 0, ratingAvg: 0 },
      });
      await switchRole(customerUser.id, "WORKER");
      const selfWorkerToken = (await generateTokens(customerUser.id, "USER"))
        .accessToken;

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${selfWorkerToken}`)
        .send({ proposedPrice: 100, estimatedTime: "1 day" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/own job/i);

      await prisma.worker.delete({ where: { id: selfWorker.id } });
    });

    it("Duplicate bid guard: same worker cannot bid twice on the same job", async () => {
      await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 350, estimatedTime: "3 days" });

      const dupRes = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 300, estimatedTime: "2 days" });

      expect(dupRes.status).toBe(409);
    });

    it("State machine guard: cannot bid on a non-OPEN job", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "CANCELLED" as never },
      });

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 200, estimatedTime: "2 days" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/applications/:id/accept — atomic bid acceptance", () => {
    let jobId: string;
    let applicationIdA: string;
    let applicationIdB: string;

    beforeEach(async () => {
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Full House Electrical Work",
          description: "Professional needed for complete electrical overhaul",
          budget: 1000,
        });
      jobId = jobRes.body.data.id;

      const appResA = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 850, estimatedTime: "5 days" });
      applicationIdA = appResA.body.data.id;

      const appResB = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerBToken}`)
        .send({ proposedPrice: 900, estimatedTime: "4 days" });
      applicationIdB = appResB.body.data.id;
    });

    it("Accepting a bid transitions job to IN_PROGRESS, rejects all other bids atomically", async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${applicationIdA}/accept`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.job.status).toBe("IN_PROGRESS");
      expect(res.body.data.job.assignedWorker.id).toBe(workerId);
      expect(res.body.data.application.status).toBe("ACCEPTED");

      const losingBid = await prisma.application.findUnique({
        where: { id: applicationIdB },
      });
      expect(losingBid?.status).toBe("REJECTED");
    });

    it("Ownership guard: non-owner cannot accept a bid", async () => {
      const workerAsCustomerToken = (
        await generateTokens(workerUser.id, "USER")
      ).accessToken;
      await switchRole(workerUser.id, "CUSTOMER");

      const res = await request(app)
        .post(`/api/v1/applications/${applicationIdA}/accept`)
        .set("Authorization", `Bearer ${workerAsCustomerToken}`);

      expect(res.status).toBe(403);
    });

    it("State machine: cannot accept a bid when job is already IN_PROGRESS", async () => {
      await request(app)
        .post(`/api/v1/applications/${applicationIdA}/accept`)
        .set("Authorization", `Bearer ${customerToken}`);

      const res = await request(app)
        .post(`/api/v1/applications/${applicationIdB}/accept`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/jobs/:id/direct-respond — worker responds to direct booking", () => {
    let directJobId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/jobs/direct")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          targetWorkerId: workerId,
          categoryId,
          title: "Direct Carpentry Booking",
          description: "Monthly maintenance contract for office furniture",
          budget: 600,
        });
      directJobId = res.body.data.id;
    });

    it("Targeted worker can ACCEPT a direct booking", async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${directJobId}/direct-respond`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ action: "ACCEPT" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("IN_PROGRESS");
      expect(res.body.data.assignedWorker.id).toBe(workerId);
    });

    it("Targeted worker can DECLINE a direct booking", async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${directJobId}/direct-respond`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ action: "DECLINE" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("DECLINED");
    });

    it("Non-targeted worker cannot respond to a direct booking", async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${directJobId}/direct-respond`)
        .set("Authorization", `Bearer ${workerBToken}`)
        .send({ action: "ACCEPT" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/applications/:id — worker withdraws bid", () => {
    let jobId: string;
    let applicationId: string;

    beforeEach(async () => {
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Tile Installation Project",
          description: "Full bathroom tiling job, professional needed ASAP",
          budget: 700,
        });
      jobId = jobRes.body.data.id;

      const appRes = await request(app)
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 650, estimatedTime: "2 days" });
      applicationId = appRes.body.data.id;
    });

    it("Worker can withdraw their own PENDING bid", async () => {
      const res = await request(app)
        .delete(`/api/v1/applications/${applicationId}`)
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("WITHDRAWN");
    });

    it("Worker cannot withdraw another worker's bid", async () => {
      const res = await request(app)
        .delete(`/api/v1/applications/${applicationId}`)
        .set("Authorization", `Bearer ${workerBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/applications/me — worker views own bids", () => {
    it("Returns all bids submitted by the authenticated worker", async () => {
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          categoryId,
          title: "Garden Landscaping Required",
          description: "Complete garden redesign and landscaping project scope",
          budget: 800,
        });
      await request(app)
        .post(`/api/v1/jobs/${jobRes.body.data.id}/apply`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ proposedPrice: 750, estimatedTime: "1 week" });

      const res = await request(app)
        .get("/api/v1/applications/me")
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].job).toBeDefined();
    });
  });
});
