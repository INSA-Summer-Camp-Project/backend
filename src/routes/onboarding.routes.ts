import { Router } from "express";

import * as onboardingController from "@/controllers/onboarding.controller";
import { completeOnboardingSchema } from "@/dtos/onboarding.dto";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/status", onboardingController.getOnboardingStatus);
router.post(
  "/complete",
  validate({ body: completeOnboardingSchema }),
  onboardingController.completeOnboarding,
);

export default router;
