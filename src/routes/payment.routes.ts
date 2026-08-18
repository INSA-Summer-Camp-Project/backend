import { Router } from "express";

import * as paymentController from "@/controllers/payment.controller";
import { createCheckoutDto } from "@/dtos/payment.dto";
import { requireActiveRole } from "@/middlewares/active-role.middleware";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

// Public webhook route (must be outside auth middleware, it uses its own signature validation)
router.post("/webhook", paymentController.webhook);

// Authenticated routes
router.use(authenticate);

router.post(
  "/checkout",
  requireActiveRole("CUSTOMER"),
  validate(createCheckoutDto),
  paymentController.checkout,
);

router.get(
  "/verify/:txRef",
  // both workers and customers can potentially view/verify payment, but usually customer.
  paymentController.verify,
);

export default router;
