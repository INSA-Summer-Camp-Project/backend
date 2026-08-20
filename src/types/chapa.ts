export interface ChapaInitializeResponse {
  message: string;
  status: string;
  data?: {
    checkout_url: string;
    tracking_id: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: string;
  data?: {
    amount: number;
    currency: string;
    charge: number;
    status: string;
    reference: string;
  };
}
