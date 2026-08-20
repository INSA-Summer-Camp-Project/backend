import type { Request, Response } from "express";

import * as notificationService from "@/services/notification.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { NotificationQueryDtoSchema } from "@/dtos/notification.dto";

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const query = NotificationQueryDtoSchema.parse(req.query);
    const result = await notificationService.getUserNotifications(
      req.user!.id,
      query,
    );
    sendSuccess(res, result.notifications, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.getUnreadCount(req.user!.id);
    sendSuccess(res, result, 200);
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAsRead(
    req.user!.id,
    req.params.id as string,
  );
  sendSuccess(res, result, 200);
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, result, 200);
  },
);
