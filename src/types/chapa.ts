export interface InitializePaymentOptions {
  amount: string;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  "customization[title]"?: string;
  "customization[description]"?: string;
}

export interface ChapaInitializeResponse {
  message: string;
  status: "success" | "failed";
  data?: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: "success" | "failed";
  data?: {
    amount: number;
    currency: string;
    charge: number;
    tx_ref: string;
    reference: string;
    status: string;
  };
}
