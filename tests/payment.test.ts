import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";
import { chapaClient } from "@/lib/chapa/chapa.client";
import type { UserPublicDto } from "@/dtos/auth.dto";
import type { Category, Job, Application } from "@prisma/client";

describe("Payment Integration Tests (/api/v1/payments)", () => {
  let customerUser: UserPublicDto;
  let customerToken: string;
  let workerUser: UserPublicDto;
  let workerToken: string;
  let category: Category;
  let job: Job;
  let application: Application;

  beforeEach(async () => {
    vi.restoreAllMocks();
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

    customerUser = await registerUser({
      name: "Customer John",
      telegramId: "tg_john_pay",
      systemRole: "USER",
    });
    await prisma.user.update({
      where: { id: customerUser.id },
      data: { lastActiveRole: "CUSTOMER" },
    });
    customerToken = (await generateTokens(customerUser.id, "USER")).accessToken;

    workerUser = await registerUser({
      name: "Worker Dave",
      telegramId: "tg_dave_pay",
      systemRole: "USER",
      role: "WORKER",
    });
    await prisma.user.update({
      where: { id: workerUser.id },
      data: { lastActiveRole: "WORKER" },
    });
    workerToken = (await generateTokens(workerUser.id, "USER")).accessToken;

    category = await prisma.category.create({
      data: { name: "Payment Category Test" },
    });

    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });
    const workerProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerUser.id },
    });

    job = await prisma.job.create({
      data: {
        customerId: customerProfile.id,
        categoryId: category.id,
        title: "Install Lighting",
        description: "Living room lighting installation",
        budget: 800,
        status: "OPEN",
      },
    });

    application = await prisma.application.create({
      data: {
        jobId: job.id,
        workerId: workerProfile.id,
        proposedPrice: 750,
        estimatedTime: "3 hours",
        status: "ACCEPTED",
      },
    });
  });

  it("POST /api/v1/payments/checkout should initialize checkout and return checkoutUrl", async () => {
    vi.spyOn(chapaClient, "initializeCheckout").mockResolvedValueOnce({
      status: "success",
      message: "Hosted Link",
      data: {
        checkout_url: "https://checkout.chapa.co/test-link",
        tracking_id: "test-tracking-id",
      },
    });

    const res = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ applicationId: application.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkoutUrl).toBe(
      "https://checkout.chapa.co/test-link",
    );
    expect(res.body.data.txRef).toBeDefined();

    // Verify payment record in DB
    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
    });
    expect(payment).toBeDefined();
    expect(payment?.amount.toNumber()).toBe(750);
    expect(payment?.status).toBe("PENDING");
  });

  it("POST /api/v1/payments/checkout should forbid non-owner from paying", async () => {
    const res = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ applicationId: application.id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/payments/webhook should process successful payment and create notifications", async () => {
    const txRef = "sh_test_tx_123456";
    await prisma.payment.create({
      data: {
        jobId: job.id,
        applicationId: application.id,
        amount: 750,
        currency: "ETB",
        method: "CHAPA",
        status: "PENDING",
        txRef,
        platformCommission: 75,
      },
    });

    vi.spyOn(chapaClient, "verifyPayment").mockResolvedValueOnce({
      status: "success",
      message: "Payment verified",
      data: {
        amount: 750,
        currency: "ETB",
        charge: 0,
        status: "success",
        reference: txRef,
      },
    });

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .send({ tx_ref: txRef });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const payment = await prisma.payment.findUnique({
      where: { txRef },
    });
    expect(payment?.status).toBe("PAID");

    // Verify notifications were created
    const notifications = await prisma.notification.findMany({
      where: { customerProfile: { userId: customerUser.id } },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]?.type).toBe("PAYMENT_SUCCESS");
  });

  it("POST /api/v1/payments/checkout should send BACKEND_PUBLIC_URL in callbackUrl and success URL in returnUrl", async () => {
    const initSpy = vi
      .spyOn(chapaClient, "initializeCheckout")
      .mockResolvedValueOnce({
        status: "success",
        message: "Hosted Link",
        data: {
          checkout_url: "https://checkout.chapa.co/test-link",
          tracking_id: "test-tracking-id",
        },
      });

    const res = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ applicationId: application.id });

    expect(res.status).toBe(200);
    expect(initSpy).toHaveBeenCalled();
    const callArgs = initSpy.mock.calls[0]![0];
    expect(callArgs.callbackUrl).toContain("/api/v1/payments/webhook");
    expect(callArgs.returnUrl).toContain(
      `/customer/checkout/${job.id}/success`,
    );
  });

  describe("GET /api/v1/payments/verify/:txRef", () => {
    it("should verify pending payment, update to PAID, and send notifications", async () => {
      const txRef = `sh_verify_${Date.now()}`;
      await prisma.payment.create({
        data: {
          jobId: job.id,
          applicationId: application.id,
          amount: 750,
          currency: "ETB",
          method: "CHAPA",
          status: "PENDING",
          txRef,
          platformCommission: 75,
        },
      });

      vi.spyOn(chapaClient, "verifyPayment").mockResolvedValueOnce({
        status: "success",
        message: "Payment verified",
        data: {
          amount: 750,
          currency: "ETB",
          charge: 0,
          status: "success",
          reference: txRef,
        },
      });

      const res = await request(app)
        .get(`/api/v1/payments/verify/${txRef}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("PAID");

      const payment = await prisma.payment.findUnique({
        where: { txRef },
      });
      expect(payment?.status).toBe("PAID");
    });

    it("should return existing PAID status without calling Chapa API again", async () => {
      const txRef = `sh_paid_${Date.now()}`;
      await prisma.payment.create({
        data: {
          jobId: job.id,
          applicationId: application.id,
          amount: 750,
          currency: "ETB",
          method: "CHAPA",
          status: "PAID",
          txRef,
          platformCommission: 75,
        },
      });

      const chapaSpy = vi.spyOn(chapaClient, "verifyPayment");

      const res = await request(app)
        .get(`/api/v1/payments/verify/${txRef}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PAID");
      expect(chapaSpy).not.toHaveBeenCalled();
    });

    it("should reject verification by non-owner (403)", async () => {
      const txRef = `sh_forbidden_${Date.now()}`;
      await prisma.payment.create({
        data: {
          jobId: job.id,
          applicationId: application.id,
          amount: 750,
          currency: "ETB",
          method: "CHAPA",
          status: "PENDING",
          txRef,
          platformCommission: 75,
        },
      });

      const res = await request(app)
        .get(`/api/v1/payments/verify/${txRef}`)
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for unknown transaction reference", async () => {
      const res = await request(app)
        .get("/api/v1/payments/verify/sh_nonexistent_tx")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Escrow Enforcement on Job Completion", () => {
    it("should reject transition to COMPLETED when no PAID payment exists", async () => {
      // Job is in OPEN status with accepted application, but no payment made yet
      const res = await request(app)
        .patch(`/api/v1/jobs/${job.id}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ status: "COMPLETED" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(
        /Cannot complete job without a verified payment in escrow/i,
      );
    });

    it("should permit transition to COMPLETED when a PAID payment exists", async () => {
      // Assign worker and create PAID payment
      const workerProfile = await prisma.worker.findUniqueOrThrow({
        where: { userId: workerUser.id },
      });
      await prisma.job.update({
        where: { id: job.id },
        data: { assignedWorkerId: workerProfile.id, status: "IN_PROGRESS" },
      });

      await prisma.payment.create({
        data: {
          jobId: job.id,
          applicationId: application.id,
          amount: 750,
          currency: "ETB",
          method: "CHAPA",
          status: "PAID",
          txRef: `sh_escrow_paid_${Date.now()}`,
          platformCommission: 75,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/jobs/${job.id}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ status: "COMPLETED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("COMPLETED");
    });
  });
});
