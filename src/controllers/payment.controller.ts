import type { Request, Response } from "express";

import type { CreateCheckoutDto } from "@/dtos/payment.dto";
import { chapaClient } from "@/lib/chapa/chapa.client";
import * as paymentService from "@/services/payment.service";
import * as paymentWebhookService from "@/services/payment-webhook.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const checkout = asyncHandler(
  async (req: Request<unknown, unknown, CreateCheckoutDto>, res: Response) => {
    const customerId = req.user!.id;
    const { applicationId } = req.body;

    const result = await paymentService.createCheckout(
      customerId,
      applicationId,
    );
    sendSuccess(res, result);
  },
);

export const verify = asyncHandler(
  async (req: Request<{ txRef: string }>, res: Response) => {
    const { txRef } = req.params;
    const result = await paymentWebhookService.handleSuccessfulPayment(txRef);
    sendSuccess(res, result);
  },
);

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const hash = req.headers["chapa-signature"] as string;

  if (!hash) {
    res.status(401).json({ success: false, error: "Missing signature" });
    return;
  }

  const payload = JSON.stringify(req.body);
  const isValid = chapaClient.verifyWebhookSignature(payload, hash);

  if (!isValid) {
    res.status(401).json({ success: false, error: "Invalid signature" });
    return;
  }

  // Process the event
  const event = req.body;

  // Only handle successful payments for now
  if (event.event === "charge.success") {
    await paymentWebhookService.handleSuccessfulPayment(event.tx_ref);
  }

  res.status(200).send("OK");
});
