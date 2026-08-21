import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { registerUser, generateTokens } from "@/services/auth.service";
import type { UserPublicDto } from "@/dtos/auth.dto";
import { JobSource, JobStatus, ReviewerRole } from "@prisma/client";

async function switchRole(
  userId: string,
  role: "CUSTOMER" | "WORKER",
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveRole: role },
  });
}

describe("Phase 5 — Ratings, Reviews & Reputation System (Bidirectional)", () => {
  let customerUser: UserPublicDto;
  let customerToken: string;

  let customerUserB: UserPublicDto;
  let customerTokenB: string;

  let workerUser: UserPublicDto;
  let workerToken: string;

  let categoryId: string;
  let workerId: string;
  let customerProfileId: string;
  let completedJobId: string;

  beforeEach(async () => {
    // Clean database in FK order
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

    // Category
    const cat = await prisma.category.create({
      data: { name: `Cat-${Date.now()}`, description: "Test" },
    });
    categoryId = cat.id;

    // Customer A
    customerUser = await registerUser({
      name: "Alice Customer",
      role: "CUSTOMER",
    });
    await switchRole(customerUser.id, "CUSTOMER");
    customerToken = generateTokens(customerUser.id, "USER").accessToken;

    const custProf = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });
    customerProfileId = custProf.id;

    // Customer B
    customerUserB = await registerUser({
      name: "Bob Customer",
      role: "CUSTOMER",
    });
    await switchRole(customerUserB.id, "CUSTOMER");
    customerTokenB = generateTokens(customerUserB.id, "USER").accessToken;

    // Worker
    workerUser = await registerUser({
      name: "Charlie Worker",
      role: "WORKER",
    });
    await switchRole(workerUser.id, "WORKER");
    workerToken = generateTokens(workerUser.id, "USER").accessToken;
    workerId = workerUser.worker!.id;

    // Create a completed job for Customer A & Worker
    const job = await prisma.job.create({
      data: {
        customerId: customerProfileId,
        categoryId,
        title: "Completed Plumbing Job",
        description: "Kitchen sink repair completed successfully",
        budget: 250,
        source: JobSource.POSTING,
        status: JobStatus.COMPLETED,
        assignedWorkerId: workerId,
      },
    });
    completedJobId = job.id;
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/v1/reviews — Bidirectional Submissions
  // -------------------------------------------------------------------------
  describe("POST /api/v1/reviews — submit review (Bidirectional)", () => {
    it("Customer can submit a review for a worker on a completed job", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 5,
          comment: "Excellent service and quick repair!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.reviewerRole).toBe("CUSTOMER_TO_WORKER");

      // Verify Worker.ratingAvg updated
      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
      });
      expect(Number(worker?.ratingAvg)).toBe(5.0);
    });

    it("Worker can submit a review for a customer on a completed job", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({
          jobId: completedJobId,
          rating: 5,
          comment: "Great customer! Clear communication and prompt payment.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.reviewerRole).toBe("WORKER_TO_CUSTOMER");

      // Verify CustomerProfile.ratingAvg updated
      const customer = await prisma.customerProfile.findUnique({
        where: { id: customerProfileId },
      });
      expect(Number(customer?.ratingAvg)).toBe(5.0);
    });

    it("Both Customer AND Worker can submit reviews for the same completed job contract", async () => {
      // Customer reviews worker
      const resCust = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 5 });

      expect(resCust.status).toBe(201);

      // Worker reviews customer on same job
      const resWrk = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ jobId: completedJobId, rating: 4 });

      expect(resWrk.status).toBe(201);

      const reviews = await prisma.review.findMany({
        where: { jobId: completedJobId },
      });
      expect(reviews.length).toBe(2);
    });

    it("Validation: rejects ratings outside 1–5 or non-integer ratings", async () => {
      const resHigh = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 6,
        });

      expect(resHigh.status).toBe(400);

      const resLow = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 0,
        });

      expect(resLow.status).toBe(400);

      const resFloat = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 4.5,
        });

      expect(resFloat.status).toBe(400);
    });

    it("Job Completion Invariant: rejects reviews on non-completed jobs (400 Bad Request)", async () => {
      const openJob = await prisma.job.create({
        data: {
          customerId: customerProfileId,
          categoryId,
          title: "In Progress Job",
          description: "Work currently underway",
          budget: 200,
          source: JobSource.POSTING,
          status: JobStatus.IN_PROGRESS,
          assignedWorkerId: workerId,
        },
      });

      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: openJob.id,
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/completed jobs/i);
    });

    it("Contract Participation Invariant: non-participant cannot review (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerTokenB}`)
        .send({
          jobId: completedJobId,
          rating: 5,
        });

      expect(res.status).toBe(403);
    });

    it("Unique Contract Review Guard per role: reject duplicate review by same party (409 Conflict)", async () => {
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 5,
          comment: "First review",
        });

      const dupRes = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          jobId: completedJobId,
          rating: 4,
          comment: "Second attempt",
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.message).toMatch(/already been submitted/i);
    });

    it("Anti-Self-Review Guard: user cannot review their own worker profile", async () => {
      const comboUser = await registerUser({
        name: "Combo User",
        role: "WORKER",
      });
      await switchRole(comboUser.id, "CUSTOMER");
      const comboToken = generateTokens(comboUser.id, "USER").accessToken;

      const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: comboUser.id },
      });

      const selfJob = await prisma.job.create({
        data: {
          customerId: customerProfile.id,
          categoryId,
          title: "Self Completed Job",
          description: "Fake job to attempt self review",
          budget: 100,
          source: JobSource.POSTING,
          status: JobStatus.COMPLETED,
          assignedWorkerId: comboUser.worker!.id,
        },
      });

      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${comboToken}`)
        .send({
          jobId: selfJob.id,
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/own contract/i);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Rating Recalculation & CRUD (PUT / DELETE / GET)
  // -------------------------------------------------------------------------
  describe("Review Updates, Deletions & Average Synchronization", () => {
    it("Updates worker and customer ratingAvg correctly across multiple reviews", async () => {
      // 1st review by Customer A -> 5 stars to Worker
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 5 });

      let worker = await prisma.worker.findUnique({ where: { id: workerId } });
      expect(Number(worker?.ratingAvg)).toBe(5.0);

      // Create a 2nd completed job for Customer B & Worker
      const customerProfileB = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: customerUserB.id },
      });
      const jobB = await prisma.job.create({
        data: {
          customerId: customerProfileB.id,
          categoryId,
          title: "Second Job",
          description: "Another completed job",
          budget: 300,
          source: JobSource.POSTING,
          status: JobStatus.COMPLETED,
          assignedWorkerId: workerId,
        },
      });

      // 2nd review by Customer B -> 3 stars to Worker
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerTokenB}`)
        .send({ jobId: jobB.id, rating: 3 });

      worker = await prisma.worker.findUnique({ where: { id: workerId } });
      expect(Number(worker?.ratingAvg)).toBe(4.0);

      // Worker reviews Customer A -> 4 stars
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ jobId: completedJobId, rating: 4 });

      const custA = await prisma.customerProfile.findUnique({
        where: { id: customerProfileId },
      });
      expect(Number(custA?.ratingAvg)).toBe(4.0);
    });

    it("PUT /api/v1/reviews/:id — updates review and recalculates average within 48h", async () => {
      const createRes = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 2 });

      const reviewId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ rating: 4, comment: "Updated comment" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.rating).toBe(4);

      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
      });
      expect(Number(worker?.ratingAvg)).toBe(4.0);
    });

    it("PUT /api/v1/reviews/:id — blocks review edits after 48 hours (403 Forbidden)", async () => {
      const createRes = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 5 });

      const reviewId = createRes.body.data.id;

      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      await prisma.review.update({
        where: { id: reviewId },
        data: { createdAt: fiftyHoursAgo },
      });

      const updateRes = await request(app)
        .put(`/api/v1/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ rating: 1 });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.error.message).toMatch(/edit window has expired/i);
    });

    it("DELETE /api/v1/reviews/:id — removes review and recalculates ratingAvg", async () => {
      const createRes = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 5 });

      const reviewId = createRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/v1/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
      });
      expect(Number(worker?.ratingAvg)).toBe(0.0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Reputation Analytics & Dynamic Badges
  // -------------------------------------------------------------------------
  describe("GET /api/v1/workers/:id/reputation — reputation metrics and badges", () => {
    it("Calculates distribution, completion rate, repeat customers, and badges", async () => {
      const customerProfileA = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: customerUser.id },
      });
      const customerProfileB = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId: customerUserB.id },
      });

      for (let i = 0; i < 2; i++) {
        const j = await prisma.job.create({
          data: {
            customerId: customerProfileA.id,
            categoryId,
            title: `Job A ${i}`,
            description: "Description test",
            budget: 100,
            source: JobSource.POSTING,
            status: JobStatus.COMPLETED,
            assignedWorkerId: workerId,
          },
        });
        await prisma.review.create({
          data: {
            jobId: j.id,
            customerId: customerProfileA.id,
            workerId,
            reviewerRole: ReviewerRole.CUSTOMER_TO_WORKER,
            rating: 5,
            comment: "Great!",
          },
        });
      }

      for (let i = 0; i < 3; i++) {
        const j = await prisma.job.create({
          data: {
            customerId: customerProfileB.id,
            categoryId,
            title: `Job B ${i}`,
            description: "Description test",
            budget: 100,
            source: JobSource.POSTING,
            status: JobStatus.COMPLETED,
            assignedWorkerId: workerId,
          },
        });
        await prisma.review.create({
          data: {
            jobId: j.id,
            customerId: customerProfileB.id,
            workerId,
            reviewerRole: ReviewerRole.CUSTOMER_TO_WORKER,
            rating: 5,
            comment: "Superb!",
          },
        });
      }

      await prisma.worker.update({
        where: { id: workerId },
        data: { ratingAvg: 5.0 },
      });

      const res = await request(app).get(
        `/api/v1/workers/${workerId}/reputation`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalReviews).toBe(5);
      expect(res.body.data.distribution["5"]).toBe(5);
      expect(res.body.data.metrics.completedJobs).toBe(6);
      expect(res.body.data.metrics.jobCompletionRate).toBe(100.0);
      expect(res.body.data.metrics.repeatCustomers).toBe(2);
      expect(res.body.data.badges).toContain("HIGH_COMPLETION");
    });
  });

  // -------------------------------------------------------------------------
  // 4. GET /api/v1/customers/:id/reviews (Public Customer Reviews)
  // -------------------------------------------------------------------------
  describe("GET /api/v1/customers/:id/reviews — public customer reviews", () => {
    it("Returns reviews submitted by workers for a specific customer", async () => {
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({
          jobId: completedJobId,
          rating: 5,
          comment: "Great customer! Clear instructions and fast payment.",
        });

      const res = await request(app).get(
        `/api/v1/customers/${customerProfileId}/reviews`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].rating).toBe(5);
      expect(res.body.data[0].comment).toBe(
        "Great customer! Clear instructions and fast payment.",
      );
      expect(res.body.data[0].worker.id).toBe(workerId);
      expect(res.body.data[0].job.id).toBe(completedJobId);
      expect(res.body.meta.total).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. GET /api/v1/reviews/my & GET /api/v1/workers/:id/reviews
  // -------------------------------------------------------------------------
  describe("Review Listing Endpoints", () => {
    it("GET /api/v1/workers/:id/reviews — returns paginated reviews for worker", async () => {
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 5, comment: "Test review" });

      const res = await request(app).get(`/api/v1/workers/${workerId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].rating).toBe(5);
      expect(res.body.meta.total).toBe(1);
    });

    it("GET /api/v1/reviews/my — returns authenticated user's reviews", async () => {
      await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ jobId: completedJobId, rating: 4, comment: "My review" });

      const res = await request(app)
        .get("/api/v1/reviews/my")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
