import type { Request, Response } from "express";

import * as paymentService from "@/services/payment.service";
import * as paymentWebhookService from "@/services/payment-webhook.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { chapaClient } from "@/lib/chapa/chapa.client";
import { env } from "@/config/env";

export const createCheckout = asyncHandler(
  async (req: Request, res: Response) => {
    const { applicationId } = req.body;
    const result = await paymentService.createCheckout(
      req.user!.id,
      applicationId,
    );
    sendSuccess(res, result, 200);
  },
);

export const handleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["chapa-signature"] as string | undefined;

    if (env.CHAPA_ENCRYPTION_KEY && signature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = chapaClient.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid webhook signature",
          },
        });
        return;
      }
    }

    const { tx_ref } = req.body;
    if (!tx_ref) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "tx_ref is required" },
      });
      return;
    }

    const result = await paymentWebhookService.handleSuccessfulPayment(tx_ref);
    sendSuccess(res, result, 200);
  },
);

export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const txRefParam = req.params.txRef;
    const txRef = Array.isArray(txRefParam) ? txRefParam[0] : txRefParam;
    if (!txRef) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "txRef is required" },
      });
      return;
    }
    const status = await paymentService.verifyPayment(txRef, req.user!.id);
    sendSuccess(res, { status }, 200);
  },
);
