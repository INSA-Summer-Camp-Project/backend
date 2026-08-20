import type { Request, Response } from "express";

import type { CreateReviewDto, ReviewQueryDto } from "@/dtos/review.dto";
import * as reviewService from "@/services/review.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const dto = req.body as CreateReviewDto;

    const review = await reviewService.createReview(userId, dto);

    sendSuccess(res, review, 201);
  },
);

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReviewQueryDto;
  const result = await reviewService.getReviews(query);

  sendSuccess(res, result.items, 200, result.meta);
});

export const getReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await reviewService.getReviewById(req.params.id as string);

    sendSuccess(res, review);
  },
);
