import { Router } from "express";

import * as reviewController from "@/controllers/review.controller";
import { CreateReviewDtoSchema, ReviewQueryDtoSchema } from "@/dtos/review.dto";
import { requireActiveRole } from "@/middlewares/active-role.middleware";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

// Public / Semi-public GET routes
router.get(
  "/",
  validate({ query: ReviewQueryDtoSchema }),
  reviewController.getReviews,
);
router.get("/:id", reviewController.getReviewById);

// Protected POST route
router.post(
  "/",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(CreateReviewDtoSchema),
  reviewController.createReview,
);

export default router;
