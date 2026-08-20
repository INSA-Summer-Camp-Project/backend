import { Router } from "express";

import * as notificationController from "@/controllers/notification.controller";
import { NotificationQueryDtoSchema } from "@/dtos/notification.dto";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.use(authenticate);

router.get(
  "/",
  validate({ query: NotificationQueryDtoSchema }),
  notificationController.getNotificationsHandler,
);

router.get("/unread-count", notificationController.getUnreadCountHandler);

router.patch("/:id/read", notificationController.markAsReadHandler);

router.patch("/read-all", notificationController.markAllAsReadHandler);

export default router;
