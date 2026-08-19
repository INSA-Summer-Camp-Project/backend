import type { Request, Response, NextFunction } from "express";
import * as reviewService from "@/services/review.service";
import * as reputationService from "@/services/reputation.service";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/v1/reviews  — submit review for completed job
// ---------------------------------------------------------------------------
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const review = await reviewService.createReview(req.user!.id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/workers/:id/reviews  — public reviews for a worker
// ---------------------------------------------------------------------------
export const getWorkerReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workerId = String(req.params.id);
    const result = await reviewService.getWorkerReviews(
      workerId,
      req.query as never,
    );
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/workers/:id/reputation  — public reputation analytics
// ---------------------------------------------------------------------------
export const getWorkerReputation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workerId = String(req.params.id);
    const data = await reputationService.getWorkerReputation(workerId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/reviews/my  — user's reviews (authored or received)
// ---------------------------------------------------------------------------
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { lastActiveRole: true },
    });
    const reviews = await reviewService.getMyReviews(
      req.user!.id,
      user?.lastActiveRole ?? null,
    );
    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/v1/reviews/:id  — update review within 48h
// ---------------------------------------------------------------------------
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reviewId = String(req.params.id);
    const review = await reviewService.updateReview(
      req.user!.id,
      reviewId,
      req.body,
    );
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reviews/:id  — delete review (author or admin)
// ---------------------------------------------------------------------------
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reviewId = String(req.params.id);
    const result = await reviewService.deleteReview(
      req.user!.id,
      req.user!.role,
      reviewId,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
