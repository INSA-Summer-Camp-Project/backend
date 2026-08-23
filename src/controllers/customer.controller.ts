import type { Request, Response } from "express";
import * as customerService from "@/services/customer.service";
import * as reviewService from "@/services/review.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await customerService.getMyCustomerProfile(req.user!.id);
    sendSuccess(res, profile);
  },
);

export const updateMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await customerService.updateMyCustomerProfile(
      req.user!.id,
      req.body,
    );
    sendSuccess(res, profile);
  },
);

export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerById(
      String(req.params.id),
    );
    sendSuccess(res, customer);
  },
);

export const getCustomerReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = String(req.params.id);
    const result = await reviewService.getCustomerReviews(
      customerId,
      req.query as { page?: number; limit?: number },
    );
    sendSuccess(res, result.data, 200, result.meta);
  },
);
