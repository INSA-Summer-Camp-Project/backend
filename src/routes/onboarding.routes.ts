import { Router } from "express";

import * as onboardingController from "@/controllers/onboarding.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", authenticate, onboardingController.getOnboardingStatus);
router.post("/", authenticate, onboardingController.completeOnboarding);

export default router;
