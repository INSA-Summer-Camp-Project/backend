import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkout, verify, webhook } from "@/controllers/payment.controller";
import type { CreateCheckoutDto } from "@/dtos/payment.dto";
import { chapaClient } from "@/lib/chapa/chapa.client";
import * as paymentService from "@/services/payment.service";
import * as paymentWebhookService from "@/services/payment-webhook.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/payment.service", () => ({
  createCheckout: vi.fn(),
  handleSuccessfulPayment: vi.fn(),
}));

vi.mock("@/services/payment-webhook.service", () => ({
  handleSuccessfulPayment: vi.fn(),
}));

// Mock chapaClient
vi.mock("@/lib/chapa/chapa.client", () => ({
  chapaClient: {
    verifyWebhookSignature: vi.fn(),
  },
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Payment Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: "user-1" } as never,
      headers: {},
      body: {},
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("checkout", () => {
    it("should create checkout and send success response", async () => {
      mockReq.body = { applicationId: "app-1" };
      const mockResult = {
        checkoutUrl: "https://checkout.chapa.co/checkout/payment/123",
      };
      vi.mocked(paymentService.createCheckout).mockResolvedValue(
        mockResult as never,
      );

      await checkout(
        mockReq as Request<Record<string, string>, unknown, CreateCheckoutDto>,
        mockRes as Response,
        mockNext,
      );

      expect(paymentService.createCheckout).toHaveBeenCalledWith(
        "user-1",
        "app-1",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });

  describe("verify", () => {
    it("should handle successful payment and send success response", async () => {
      mockReq.params = { txRef: "tx-123" };
      const mockResult = { id: "payment-1" };
      vi.mocked(
        paymentWebhookService.handleSuccessfulPayment,
      ).mockResolvedValue(mockResult as never);

      await verify(
        mockReq as Request<{ txRef: string }>,
        mockRes as Response,
        mockNext,
      );

      expect(
        paymentWebhookService.handleSuccessfulPayment,
      ).toHaveBeenCalledWith("tx-123");
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });

  describe("webhook", () => {
    it("should return 401 if signature is missing", async () => {
      await webhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Missing signature",
      });
    });

    it("should return 401 if signature is invalid", async () => {
      mockReq.headers = { "chapa-signature": "invalid-hash" };
      vi.mocked(chapaClient.verifyWebhookSignature).mockReturnValue(false);

      await webhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid signature",
      });
    });

    it("should process charge.success event and send OK", async () => {
      mockReq.headers = { "chapa-signature": "valid-hash" };
      mockReq.body = { event: "charge.success", tx_ref: "tx-123" };
      vi.mocked(chapaClient.verifyWebhookSignature).mockReturnValue(true);

      await webhook(mockReq as Request, mockRes as Response, mockNext);

      expect(
        paymentWebhookService.handleSuccessfulPayment,
      ).toHaveBeenCalledWith("tx-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith("OK");
    });

    it("should ignore other events and send OK", async () => {
      mockReq.headers = { "chapa-signature": "valid-hash" };
      mockReq.body = { event: "charge.failed", tx_ref: "tx-123" };
      vi.mocked(chapaClient.verifyWebhookSignature).mockReturnValue(true);

      await webhook(mockReq as Request, mockRes as Response, mockNext);

      expect(
        paymentWebhookService.handleSuccessfulPayment,
      ).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith("OK");
    });

    it("should call next with error if service throws", async () => {
      mockReq.headers = { "chapa-signature": "valid-hash" };
      mockReq.body = { event: "charge.success", tx_ref: "tx-123" };
      vi.mocked(chapaClient.verifyWebhookSignature).mockReturnValue(true);
      const error = new Error("Database error");
      vi.mocked(
        paymentWebhookService.handleSuccessfulPayment,
      ).mockRejectedValue(error as never);

      await webhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
