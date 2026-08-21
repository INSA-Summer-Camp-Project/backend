import type { Request, Response } from "express";
import * as reviewService from "@/services/review.service";
import * as reputationService from "@/services/reputation.service";
import { prisma } from "@/lib/prisma";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { lastActiveRole: true },
    });
    const activeRole = user?.lastActiveRole || "CUSTOMER";

    const review = await reviewService.createReview(
      req.user!.id,
      activeRole,
      req.body,
    );
    sendSuccess(res, review, 201);
  },
);

export const getWorkerReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const workerId = String(req.params.id);
    const result = await reviewService.getWorkerReviews(
      workerId,
      req.query as never,
    );
    sendSuccess(res, result.data, 200, result.meta);
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

export const getWorkerReputation = asyncHandler(
  async (req: Request, res: Response) => {
    const workerId = String(req.params.id);
    const data = await reputationService.getWorkerReputation(workerId);
    sendSuccess(res, data);
  },
);

export const getMyReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { lastActiveRole: true },
    });
    const reviews = await reviewService.getMyReviews(
      req.user!.id,
      user?.lastActiveRole ?? null,
    );
    sendSuccess(res, reviews);
  },
);

export const updateReview = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewId = String(req.params.id);
    const review = await reviewService.updateReview(
      req.user!.id,
      reviewId,
      req.body,
    );
    sendSuccess(res, review);
  },
);

export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewId = String(req.params.id);
    const result = await reviewService.deleteReview(
      req.user!.id,
      req.user!.role,
      reviewId,
    );
    sendSuccess(res, result);
  },
);
