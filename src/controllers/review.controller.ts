import type { Request, Response } from "express";

import type { CreateReviewDto, ReviewQueryDto } from "@/dtos/review.dto";
import * as reviewService from "@/services/review.service";
import { asyncHandler } from "@/utils/async-handler";

export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // We pass userId to the service, and the service will find the customerId
    const dto = req.body as CreateReviewDto;

    const review = await reviewService.createReview(userId, dto);

    res.status(201).json({
      success: true,
      data: review,
    });
  },
);

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReviewQueryDto;
  const result = await reviewService.getReviews(query);

  res.json({
    success: true,
    data: result.items,
    meta: result.meta,
  });
});

export const getReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await reviewService.getReviewById(req.params.id as string);

    res.json({
      success: true,
      data: review,
    });
  },
);
