import { Router } from "express";
import * as reviewController from "@/controllers/review.controller";

const router: Router = Router();

// GET /api/v1/customers/:id/reviews — public reviews for a customer
router.get("/:id/reviews", reviewController.getCustomerReviews);

export default router;
