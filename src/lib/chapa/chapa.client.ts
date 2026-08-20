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

export interface IPaymentGateway {
  initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<ChapaInitializeResponse>;
  verifyPayment(txRef: string): Promise<ChapaVerifyResponse>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

export class ChapaGateway implements IPaymentGateway {
  private readonly baseUrl = "https://api.chapa.co/v1";

  /**
   * Initializes a payment with Chapa and returns the checkout URL
   */
  async initializeCheckout(
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
        title: "ServiceHub Pay",
        description: `Payment for transaction ${input.txRef}`.slice(0, 50),
      },
    };

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Chapa initialize failed: ${JSON.stringify(data)}`);
    }

    return data as ChapaInitializeResponse;
  }

  /**
   * Verifies a payment with Chapa using the transaction reference
   */
  async verifyPayment(txRef: string): Promise<ChapaVerifyResponse> {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${txRef}`,
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
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha256", env.CHAPA_ENCRYPTION_KEY)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }
}

export const chapaClient = new ChapaGateway();
