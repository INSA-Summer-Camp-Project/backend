import type { NextFunction, Request, Response } from "express";

import type { CreateCheckoutDto } from "@/dtos/payment.dto";
import { ChapaClient } from "@/lib/chapa/chapa.client";
import * as paymentService from "@/services/payment.service";
import { sendSuccess } from "@/utils/response.util";

export const checkout = async (
  req: Request<unknown, unknown, CreateCheckoutDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { applicationId } = req.body;

    const result = await paymentService.createCheckout(
      customerId,
      applicationId,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: Request<{ txRef: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { txRef } = req.params;
    const result = await paymentService.handleSuccessfulPayment(txRef);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const hash = req.headers["chapa-signature"] as string;

    if (!hash) {
      res.status(401).json({ success: false, error: "Missing signature" });
      return;
    }

    const payload = JSON.stringify(req.body);
    const isValid = ChapaClient.verifyWebhookSignature(payload, hash);

    if (!isValid) {
      res.status(401).json({ success: false, error: "Invalid signature" });
      return;
    }

    // Process the event
    const event = req.body;

    // Only handle successful payments for now
    if (event.event === "charge.success") {
      await paymentService.handleSuccessfulPayment(event.tx_ref);
    }

    res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};
