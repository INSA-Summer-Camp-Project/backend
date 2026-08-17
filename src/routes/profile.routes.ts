import { ActiveRole } from "@prisma/client";
import { Router } from "express";

import * as profileController from "@/controllers/profile.controller";
import {
  createCertificateSchema,
  createPortfolioSchema,
  updateWorkerProfileSchema,
} from "@/dtos/profile.dto";
import { requireActiveRole } from "@/middlewares/active-role.middleware";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

// All profile endpoints require authentication
router.use(authenticate);

// Worker Profile endpoints (require WORKER context)
router.put(
  "/worker",
  requireActiveRole(ActiveRole.WORKER),
  validate(updateWorkerProfileSchema),
  profileController.updateWorkerProfile,
);
router.post(
  "/worker/portfolio",
  requireActiveRole(ActiveRole.WORKER),
  validate(createPortfolioSchema),
  profileController.addPortfolioItem,
);
router.post(
  "/worker/certificates",
  requireActiveRole(ActiveRole.WORKER),
  validate(createCertificateSchema),
  profileController.addCertificate,
);

export default router;
