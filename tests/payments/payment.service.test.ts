import {
  ApplicationStatus,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";
import * as applicationService from "@/services/application.service";
import * as paymentService from "@/services/payment.service";
import * as paymentWebhookService from "@/services/payment-webhook.service";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: { findUnique: vi.fn() },
    customerProfile: { findUnique: vi.fn() },
    payment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock("@/lib/chapa/chapa.client", () => ({
  chapaClient: {
    initializeCheckout: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

vi.mock("@/services/application.service", () => ({
  acceptAndAssignJob: vi.fn(),
}));

describe("Payment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckout", () => {
    it("should throw error if application is not found", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);

      await expect(
        paymentService.createCheckout("cust-1", "app-1"),
      ).rejects.toThrow("Application not found");
    });

    it("should throw error if customer does not own the job", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: "app-1",
        job: { customerId: "other-cust" },
      } as never);

      await expect(
        paymentService.createCheckout("cust-1", "app-1"),
      ).rejects.toThrow("Not authorized to pay for this application");
    });

    it("should throw error if job is not open", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: "app-1",
        status: ApplicationStatus.PENDING,
        job: { customerId: "cust-1", status: JobStatus.ASSIGNED },
      } as never);

      await expect(
        paymentService.createCheckout("cust-1", "app-1"),
      ).rejects.toThrow("Job is no longer open");
    });

    it("should correctly calculate commission and call Chapa", async () => {
      const mockApp = {
        id: "app-1",
        jobId: "job-1",
        proposedPrice: "1000",
        status: ApplicationStatus.PENDING,
        job: { customerId: "cust-1", status: JobStatus.OPEN },
      };
      const mockCustomer = {
        id: "cust-1",
        user: { name: "John Doe", telegramId: "john123" },
      };

      vi.mocked(prisma.application.findUnique).mockResolvedValue(
        mockApp as never,
      );
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue(
        mockCustomer as never,
      );
      vi.mocked(chapaClient.initializeCheckout).mockResolvedValue({
        data: { checkout_url: "https://chapa.co/checkout/123" },
      } as never);

      const result = await paymentService.createCheckout("cust-1", "app-1");

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobId: "job-1",
          applicationId: "app-1",
          amount: 1000,
          platformCommission: 100, // 10%
          method: PaymentMethod.CHAPA,
        }),
      });

      expect(chapaClient.initializeCheckout).toHaveBeenCalled();
      expect(result.checkoutUrl).toBe("https://chapa.co/checkout/123");
      expect(result.txRef).toBeDefined();
    });
  });

  describe("handleSuccessfulPayment", () => {
    it("should verify via Chapa and orchestrate application service", async () => {
      const mockPayment = {
        id: "pay-1",
        txRef: "tx-123",
        status: PaymentStatus.PENDING,
        applicationId: "app-1",
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never,
      );
      vi.mocked(chapaClient.verifyPayment).mockResolvedValue({
        status: "success",
        data: { status: "success" },
      } as never);
      vi.mocked(prisma.payment.update).mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      } as never);
      vi.mocked(applicationService.acceptAndAssignJob).mockResolvedValue({
        acceptedApp: { id: "app-1", status: ApplicationStatus.ACCEPTED },
        assignedJob: { id: "job-1", status: JobStatus.ASSIGNED },
      } as never);

      const result =
        await paymentWebhookService.handleSuccessfulPayment("tx-123");

      expect(chapaClient.verifyPayment).toHaveBeenCalledWith("tx-123");
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: PaymentStatus.PAID },
      });
      expect(applicationService.acceptAndAssignJob).toHaveBeenCalledWith(
        prisma,
        "app-1",
      );

      // @ts-expect-error typescript might complain if the mock types don't exactly match the inferred return type, but this is a test.
      expect(result.payment?.status).toBe(PaymentStatus.PAID);

      if ("application" in result) {
        expect(result.application?.status).toBe(ApplicationStatus.ACCEPTED);
      }
    });

    it("should return early if already paid", async () => {
      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        status: PaymentStatus.PAID,
      } as never);

      const result =
        await paymentWebhookService.handleSuccessfulPayment("tx-123");

      expect(result).toEqual({
        success: true,
        message: "Payment already processed",
      });
      expect(chapaClient.verifyPayment).not.toHaveBeenCalled();
    });
  });
});
