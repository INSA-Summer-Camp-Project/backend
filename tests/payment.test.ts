import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { registerUser, generateTokens } from "@/services/auth.service";
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
    customerToken = generateTokens(customerUser.id, "USER").accessToken;

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
    workerToken = generateTokens(workerUser.id, "USER").accessToken;

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
        status: "PENDING",
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
      where: { userId: customerUser.id },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]?.type).toBe("PAYMENT_SUCCESS");
  });
});
