import { Router } from "express";

import * as notificationController from "@/controllers/notification.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", authenticate, notificationController.getNotifications);
router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount,
);
router.patch("/:id/read", authenticate, notificationController.markAsRead);
router.patch("/read-all", authenticate, notificationController.markAllAsRead);

export default router;
