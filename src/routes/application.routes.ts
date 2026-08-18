import { Router } from "express";

import * as applicationController from "@/controllers/application.controller";
import { createApplicationSchema } from "@/dtos/application.dto";
import { requireActiveRole } from "@/middlewares/active-role.middleware";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.use(authenticate);

// Worker Routes
router.post(
  "/",
  requireActiveRole("WORKER"),
  validate(createApplicationSchema),
  applicationController.createApplication,
);

router.get(
  "/worker",
  requireActiveRole("WORKER"),
  applicationController.getWorkerApplications,
);

router.delete(
  "/:id",
  requireActiveRole("WORKER"),
  applicationController.withdrawApplication,
);

// Customer Routes
router.get(
  "/job/:jobId",
  requireActiveRole("CUSTOMER"),
  applicationController.getJobApplications,
);

router.post(
  "/:id/reject",
  requireActiveRole("CUSTOMER"),
  applicationController.rejectApplication,
);

export default router;
