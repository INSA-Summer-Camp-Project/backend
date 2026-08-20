import { ActiveRole } from "@prisma/client";
import { Router } from "express";

import * as jobController from "@/controllers/job.controller";
import { type PaginationDto, paginationSchema } from "@/dtos/common.dto";
import { createJobSchema, updateJobStatusSchema } from "@/dtos/job.dto";
import { requireActiveRole } from "@/middlewares/active-role.middleware";
import { authenticate, optionalAuth } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

// Public routes (though authenticate might be used optionally in the controller)
router.get(
  "/public",
  validate({ query: paginationSchema }),
  jobController.getPublicJobs,
);

// Protected routes
router.post(
  "/",
  authenticate,
  requireActiveRole(ActiveRole.CUSTOMER),
  validate(createJobSchema),
  jobController.createJob,
);
router.get(
  "/customer/jobs",
  authenticate,
  requireActiveRole(ActiveRole.CUSTOMER),
  jobController.getCustomerJobs,
);
router.get(
  "/worker/jobs",
  authenticate,
  requireActiveRole(ActiveRole.WORKER),
  jobController.getWorkerJobs,
);

// Dynamic routes (must be last)
router.patch(
  "/:id/status",
  authenticate,
  requireActiveRole(ActiveRole.CUSTOMER),
  validate(updateJobStatusSchema),
  jobController.updateJobStatus,
);
router.get("/:id", optionalAuth, jobController.getJobById);

export default router;
