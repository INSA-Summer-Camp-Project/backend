import { Router } from "express";
import * as workerController from "@/controllers/worker.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  UpdateWorkerProfileSchema,
  CreateWorkerServiceSchema,
  UpdateWorkerServiceSchema,
  CreatePortfolioSchema,
  CreateCertificateSchema,
  WorkerQueryDtoSchema,
} from "@/dtos/worker.dto";

const router: Router = Router();

router.get(
  "/",
  authenticate,
  validate(WorkerQueryDtoSchema, "query"),
  workerController.getWorkers,
);

const workerOnly = [authenticate, requireRole(["WORKER"])];

// Profile (Me)
router.get("/me", ...workerOnly, workerController.getMyProfile);
router.put(
  "/me",
  ...workerOnly,
  validate(UpdateWorkerProfileSchema),
  workerController.updateMyProfile,
);

// Services / Skills (Me)
router.get("/me/services", ...workerOnly, workerController.getMyServices);
router.post(
  "/me/services",
  ...workerOnly,
  validate(CreateWorkerServiceSchema),
  workerController.createService,
);
router.put(
  "/me/services/:serviceId",
  ...workerOnly,
  validate(UpdateWorkerServiceSchema),
  workerController.updateService,
);
router.delete(
  "/me/services/:serviceId",
  ...workerOnly,
  workerController.deleteService,
);

// Portfolios (Me)
router.post(
  "/me/portfolios",
  ...workerOnly,
  validate(CreatePortfolioSchema),
  workerController.createPortfolio,
);
router.delete(
  "/me/portfolios/:portfolioId",
  ...workerOnly,
  workerController.deletePortfolio,
);

// Certificates (Me)
router.post(
  "/me/certificates",
  ...workerOnly,
  validate(CreateCertificateSchema),
  workerController.createCertificate,
);
router.delete(
  "/me/certificates/:certificateId",
  ...workerOnly,
  workerController.deleteCertificate,
);

import * as reviewController from "@/controllers/review.controller";
import { workerReviewsQuerySchema } from "@/dtos/review.dto";

// Public Profile & Reputation (by worker.id)
router.get("/:id", workerController.getWorkerById);
router.get(
  "/:id/reviews",
  validate(workerReviewsQuerySchema, "query"),
  reviewController.getWorkerReviews,
);
router.get("/:id/reputation", reviewController.getWorkerReputation);

export default router;
