import crypto from "node:crypto";

import { env } from "@/config/env";
import type {
  ChapaInitializeResponse,
  ChapaVerifyResponse,
} from "@/types/chapa";

export interface InitializeCheckoutInput {
  amount: number;
  currency: string;
  txRef: string;
  returnUrl: string;
  callbackUrl: string;
  customer: {
    email: string;
    firstName: string;
    lastName?: string;
  };
}

export class ChapaClient {
  private static readonly BASE_URL = "https://api.chapa.co/v1";

  /**
   * Initializes a payment with Chapa and returns the checkout URL
   */
  static async initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<ChapaInitializeResponse> {
    const payload = {
      amount: input.amount.toString(),
      currency: input.currency,
      tx_ref: input.txRef,
      return_url: input.returnUrl,
      callback_url: input.callbackUrl,
      email: input.customer.email,
      first_name: input.customer.firstName,
      last_name: input.customer.lastName || "User",
      customization: {
        title: "ServiceHub Payment",
        description: `Payment for ServiceHub transaction ${input.txRef}`,
      },
    };

    const response = await fetch(`${this.BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Chapa initialize failed: ${data.message || "Unknown error"}`,
      );
    }

    return data as ChapaInitializeResponse;
  }

  /**
   * Verifies a payment with Chapa using the transaction reference
   */
  static async verifyPayment(txRef: string): Promise<ChapaVerifyResponse> {
    const response = await fetch(
      `${this.BASE_URL}/transaction/verify/${txRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Chapa verify failed: ${data.message || "Unknown error"}`,
      );
    }

    return data as ChapaVerifyResponse;
  }

  /**
   * Verify Chapa webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha256", env.CHAPA_ENCRYPTION_KEY)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }
}
