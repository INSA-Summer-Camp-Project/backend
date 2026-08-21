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

// Customer: accept a specific bid (atomic transaction) - support both POST and PATCH
router.post(
  "/:id/accept",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.acceptApplication,
);
router.patch(
  "/:id/accept",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.acceptApplication,
);

// Customer: reject a specific bid - support both POST and PATCH
router.post(
  "/:id/reject",
  authenticate,
  requireActiveRole("CUSTOMER"),
  applicationController.rejectApplication,
);
router.patch(
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
