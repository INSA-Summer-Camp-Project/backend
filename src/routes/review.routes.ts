import { Router } from "express";
import * as reviewController from "@/controllers/review.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { createReviewSchema, updateReviewSchema } from "@/dtos/review.dto";

const router: Router = Router();

// Customer: submit a review for a completed job
router.post(
  "/",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(createReviewSchema),
  reviewController.createReview,
);

// Auth: get user's reviews (authored or received)
router.get("/my", authenticate, reviewController.getMyReviews);

// Customer: update an existing review within 48h
router.put(
  "/:id",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(updateReviewSchema),
  reviewController.updateReview,
);

// Auth (Author or Admin): delete a review
router.delete("/:id", authenticate, reviewController.deleteReview);

export default router;
