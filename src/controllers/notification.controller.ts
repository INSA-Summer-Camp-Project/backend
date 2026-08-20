import type { Request, Response } from "express";

import type { NotificationQueryDto } from "@/dtos/notification.dto";
import * as notificationService from "@/services/notification.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = req.query as unknown as NotificationQueryDto;
    const result = await notificationService.getUserNotifications(
      userId,
      query,
    );
    sendSuccess(res, result);
  },
);

export const getUnreadCountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await notificationService.getUnreadCount(userId);
    sendSuccess(res, result);
  },
);

export const markAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const result = await notificationService.markAsRead(userId, id);
    sendSuccess(res, result);
  },
);

export const markAllAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await notificationService.markAllAsRead(userId);
    sendSuccess(res, result);
  },
);
