import crypto from "node:crypto";

import {
  ApplicationStatus,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { ChapaGateway } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";
import * as paymentService from "@/services/payment.service";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

// Real Chapa client (not mocked)
const chapa = new ChapaGateway();

// Test data IDs for cleanup
let testUserId: string;
let testCustomerId: string;
let testWorkerUserId: string;
let testWorkerId: string;
let testJobId: string;
let testApplicationId: string;
let testPaymentId: string;

// Helper: create a minimal user + customer profile + job + application
async function seedTestData() {
  // Create customer user
  const customerUser = await prisma.user.create({
    data: {
      telegramId: `test_e2e_${Date.now()}`,
      name: "E2E Test Customer",
      lastActiveRole: "CUSTOMER",
    },
  });
  testUserId = customerUser.id;

  const customerProfile = await prisma.customerProfile.create({
    data: { userId: customerUser.id },
  });
  testCustomerId = customerProfile.id;

  // Create worker user
  const workerUser = await prisma.user.create({
    data: {
      telegramId: `test_e2e_worker_${Date.now()}`,
      name: "E2E Test Worker",
      lastActiveRole: "WORKER",
    },
  });
  testWorkerUserId = workerUser.id;

  const workerProfile = await prisma.workerProfile.create({
    data: {
      userId: workerUser.id,
      bio: "Test worker for E2E",
      baseRate: 500,
      experience: "2 years",
    },
  });
  testWorkerId = workerProfile.id;

  // Create a service category
  const category = await prisma.serviceCategory.upsert({
    where: { name: "E2E Test Category" },
    update: {},
    create: { name: "E2E Test Category" },
  });

  // Create a job
  const job = await prisma.job.create({
    data: {
      customerId: testCustomerId,
      source: "MARKETPLACE",
      title: "E2E Test Job",
      description: "Integration test job for Chapa payment flow",
      categoryId: category.id,
      budget: 1000,
      status: JobStatus.OPEN,
    },
  });
  testJobId = job.id;

  // Create an application (bid)
  const application = await prisma.application.create({
    data: {
      jobId: testJobId,
      workerId: testWorkerId,
      proposedPrice: 1000,
      estimatedTime: 2,
      status: ApplicationStatus.PENDING,
    },
  });
  testApplicationId = application.id;
}

async function cleanupTestData() {
  // Delete in reverse order of foreign key dependencies
  if (testPaymentId) {
    await prisma.payment
      .delete({ where: { id: testPaymentId } })
      .catch(() => {});
  }
  if (testApplicationId) {
    await prisma.application
      .delete({ where: { id: testApplicationId } })
      .catch(() => {});
  }
  if (testJobId) {
    await prisma.job.delete({ where: { id: testJobId } }).catch(() => {});
  }
  if (testWorkerId) {
    await prisma.workerProfile
      .delete({ where: { id: testWorkerId } })
      .catch(() => {});
  }
  if (testWorkerUserId) {
    await prisma.user
      .delete({ where: { id: testWorkerUserId } })
      .catch(() => {});
  }
  if (testCustomerId) {
    await prisma.customerProfile
      .delete({ where: { id: testCustomerId } })
      .catch(() => {});
  }
  if (testUserId) {
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  }
}

describe("Chapa Payment Gateway E2E", { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("should initialize a checkout and return a checkout URL", async () => {
    const txRef = `sh_e2e_${Date.now().toString().slice(-6)}`;

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: "1000",
        currency: "ETB",
        tx_ref: txRef,
        return_url: "http://localhost:3000/payment/success",
        callback_url: "http://localhost:3000/api/payments/webhook",
        email: `user${Date.now()}@servicehub.io`,
        first_name: "E2E",
        last_name: "Customer",
        customization: {
          title: "ServiceHub Pay",
          description: "Integration test payment",
        },
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.status).toBe("success");
    expect(data.data).toBeDefined();
    expect(data.data.checkout_url).toContain("chapa.co");
  });

  it("should verify a payment (returns pending since no user paid)", async () => {
    const txRef = `sh_verify_${Date.now().toString().slice(-6)}`;

    // First initialize
    const initResponse = await fetch(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: "500",
          currency: "ETB",
          tx_ref: txRef,
          return_url: "http://localhost:3000/payment/success",
          callback_url: "http://localhost:3000/api/payments/webhook",
          email: `user${Date.now()}@servicehub.io`,
          first_name: "Verify",
          last_name: "Test",
        }),
      },
    );

    const _initData = await initResponse.json();
    expect(initResponse.ok).toBe(true);
    const verifyResponse = await fetch(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await verifyResponse.json();

    expect(verifyResponse.ok).toBe(true);
    expect(data.status).toBe("success");
    expect(data.data).toBeDefined();
    expect(data.data.tx_ref).toBe(txRef);
    expect(data.data.status).toBe("pending"); // No real payment was made
    expect(data.data.amount).toBe(500);
    expect(data.data.currency).toBe("ETB");
  });

  it("should verify webhook signature with correct HMAC", () => {
    const payload = JSON.stringify({
      event: "charge.success",
      tx_ref: "tx-test-123",
    });

    // Compute the expected signature using the encryption key
    const expectedHash = crypto
      .createHmac("sha256", env.CHAPA_ENCRYPTION_KEY)
      .update(payload)
      .digest("hex");

    // Valid signature should pass
    const isValid = chapa.verifyWebhookSignature(payload, expectedHash);
    expect(isValid).toBe(true);

    // Invalid signature should fail
    const isInvalid = chapa.verifyWebhookSignature(payload, "wrong-hash");
    expect(isInvalid).toBe(false);
  });

  it("should create a checkout via service and persist Payment record in DB", async () => {
    const result = await paymentService.createCheckout(
      testCustomerId,
      testApplicationId,
    );

    // Should return checkout URL and txRef
    expect(result.checkoutUrl).toBeDefined();
    expect(result.checkoutUrl).toContain("chapa.co");
    expect(result.txRef).toBeDefined();
    expect(result.txRef).toContain("sh_");

    // Find the payment record in DB
    const payment = await prisma.payment.findUnique({
      where: { txRef: result.txRef },
    });

    expect(payment).not.toBeNull();
    expect(payment!.jobId).toBe(testJobId);
    expect(payment!.applicationId).toBe(testApplicationId);
    expect(Number(payment!.amount)).toBe(1000);
    expect(payment!.currency).toBe("ETB");
    expect(payment!.method).toBe(PaymentMethod.CHAPA);
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(Number(payment!.platformCommission)).toBe(100); // 10% of 1000

    // Store for cleanup
    testPaymentId = payment!.id;
  });

  it("should return error when calling Chapa with invalid API key", async () => {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: "Bearer INVALID_KEY_12345",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: "1000",
        currency: "ETB",
        tx_ref: `sh_bad_${Date.now().toString().slice(-6)}`,
        email: `user${Date.now()}@servicehub.io`,
        first_name: "Test",
        last_name: "User",
      }),
    });

    const data = await response.json();

    // Chapa returns non-200 with a failed status
    expect(response.ok).toBe(false);
    expect(data.status).toBe("failed");
  });

  it("should return error when amount is zero or negative", async () => {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: "0",
        currency: "ETB",
        tx_ref: `sh_zero_${Date.now().toString().slice(-6)}`,
        email: `user${Date.now()}@servicehub.io`,
        first_name: "Test",
        last_name: "User",
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(false);
    expect(data.status).toBe("failed");
  });

  it("should return error when verifying a non-existent txRef", async () => {
    const fakeTxRef = `sh_noexist_${Date.now().toString().slice(-6)}`;

    const response = await fetch(
      `${CHAPA_BASE_URL}/transaction/verify/${fakeTxRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    // Chapa returns an error for unknown txRefs
    expect(data.status).toBe("failed");
  });
});
