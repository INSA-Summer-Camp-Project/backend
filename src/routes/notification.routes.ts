import { Router } from "express";

import * as notificationController from "@/controllers/notification.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";

const router: Router = Router();

const customerOnly = [authenticate, requireActiveRole("CUSTOMER")] as const;
const workerOnly = [authenticate, requireActiveRole("WORKER")] as const;

router.get(
  "/customer",
  ...customerOnly,
  notificationController.getCustomerNotifications,
);
router.get(
  "/customer/unread-count",
  ...customerOnly,
  notificationController.getCustomerUnreadCount,
);
router.patch(
  "/customer/read-all",
  ...customerOnly,
  notificationController.markAllCustomerAsRead,
);
router.patch(
  "/customer/:id/read",
  ...customerOnly,
  notificationController.markCustomerAsRead,
);

router.get(
  "/worker",
  ...workerOnly,
  notificationController.getWorkerNotifications,
);
router.get(
  "/worker/unread-count",
  ...workerOnly,
  notificationController.getWorkerUnreadCount,
);
router.patch(
  "/worker/read-all",
  ...workerOnly,
  notificationController.markAllWorkerAsRead,
);
router.patch(
  "/worker/:id/read",
  ...workerOnly,
  notificationController.markWorkerAsRead,
);

export default router;
