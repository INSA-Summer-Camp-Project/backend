import type { Request, Response } from "express";

import * as notificationService from "@/services/notification.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { NotificationQueryDtoSchema } from "@/dtos/notification.dto";

export const getCustomerNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const query = NotificationQueryDtoSchema.parse(req.query);
    const result = await notificationService.listCustomerNotifications(
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

export const getWorkerNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const query = NotificationQueryDtoSchema.parse(req.query);
    const result = await notificationService.listWorkerNotifications(
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

export const getCustomerUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.getCustomerUnreadCount(
      req.user!.id,
    );
    sendSuccess(res, result, 200);
  },
);

export const getWorkerUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.getWorkerUnreadCount(req.user!.id);
    sendSuccess(res, result, 200);
  },
);

export const markCustomerAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markCustomerNotificationAsRead(
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, result, 200);
  },
);

export const markWorkerAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markWorkerNotificationAsRead(
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, result, 200);
  },
);

export const markAllCustomerAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markAllCustomerNotificationsAsRead(
      req.user!.id,
    );
    sendSuccess(res, result, 200);
  },
);

export const markAllWorkerAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markAllWorkerNotificationsAsRead(
      req.user!.id,
    );
    sendSuccess(res, result, 200);
  },
);
