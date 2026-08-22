import { Router } from "express";
import * as customerController from "@/controllers/customer.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { UpdateCustomerProfileSchema } from "@/dtos/customer.dto";

const router: Router = Router();

const customerOnly = [authenticate, requireActiveRole("CUSTOMER")];

// Profile (Me)
router.get("/me", ...customerOnly, customerController.getMyProfile);
router.put(
  "/me",
  ...customerOnly,
  validate(UpdateCustomerProfileSchema),
  customerController.updateMyProfile,
);

// Public Customer Profile
router.get("/:id", customerController.getCustomerById);

// Public Reviews for Customer
router.get("/:id/reviews", customerController.getCustomerReviews);

export default router;
