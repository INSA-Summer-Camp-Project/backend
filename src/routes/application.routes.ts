import { Router } from "express";
import * as applicationController from "@/controllers/application.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";

const router: Router = Router();

// Worker: view their own bids/proposals
router.get(
  "/me",
  authenticate,
  requireActiveRole("WORKER"),
  applicationController.getMyApplications,
);

// Customer: accept a specific bid (atomic transaction)
router.post(
  "/:id/accept",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.acceptApplication,
);

// Customer: reject a specific bid
router.post(
  "/:id/reject",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.rejectApplication,
);

// Worker: withdraw their own bid
router.delete(
  "/:id",
  authenticate,
  requireActiveRole("WORKER"),
  applicationController.withdrawApplication,
);

export default router;
