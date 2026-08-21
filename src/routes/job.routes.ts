import { Router } from "express";
import * as jobController from "@/controllers/job.controller";
import * as applicationController from "@/controllers/application.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  CreateJobDtoSchema,
  CreateDirectJobDtoSchema,
  JobQueryDtoSchema,
  UpdateJobDtoSchema,
  DirectRespondDtoSchema,
  UpdateJobStatusDtoSchema,
} from "@/dtos/job.dto";
import { CreateApplicationDtoSchema } from "@/dtos/application.dto";

const router: Router = Router();

// Public marketplace listing (no auth required)
router.get(
  "/",
  validate(JobQueryDtoSchema, "query"),
  jobController.getPublicJobs,
);

// Customer: create marketplace posting
router.post(
  "/",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(CreateJobDtoSchema),
  jobController.createJob,
);

// Customer: create a direct-hire booking
router.post(
  "/direct",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(CreateDirectJobDtoSchema),
  jobController.createDirectJob,
);

// Auth: my jobs (role-aware)
router.get("/my", authenticate, jobController.getMyJobs);

// Auth: full job detail (applications list included if requester is owner)
router.get("/:id", authenticate, jobController.getJobById);

// Customer: update an OPEN posting
router.put(
  "/:id",
  authenticate,
  requireActiveRole("CUSTOMER"),
  validate(UpdateJobDtoSchema),
  jobController.updateJob,
);

// Worker: respond to a direct booking
router.patch(
  "/:id/direct-respond",
  authenticate,
  requireActiveRole("WORKER"),
  validate(DirectRespondDtoSchema),
  jobController.directRespond,
);

// Auth: patch job status (COMPLETED / CANCELLED)
router.patch(
  "/:id/status",
  authenticate,
  validate(UpdateJobStatusDtoSchema),
  jobController.updateJobStatus,
);

// Worker: submit bid on a marketplace job
router.post(
  "/:jobId/apply",
  authenticate,
  requireActiveRole("WORKER"),
  validate(CreateApplicationDtoSchema),
  applicationController.applyToJob,
);

// Customer: view bids on their marketplace job
router.get(
  "/:jobId/applications",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.getJobApplications,
);

// Customer & Worker: view mutual contact info for assigned/completed jobs
router.get("/:id/contact", authenticate, jobController.getJobContact);

export default router;
