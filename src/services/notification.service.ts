import type { NotificationQueryDto } from "@/dtos/notification.dto";
import { prisma } from "@/lib/prisma";

export const getUserNotifications = async (
  userId: string,
  query: NotificationQueryDto,
) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { count: result.count };
};

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string,
) => {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link: link ?? null,
    },
  });
};
