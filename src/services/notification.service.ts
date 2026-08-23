import type { NotificationQueryDto } from "@/dtos/notification.dto";
import type { NotificationType, Prisma } from "@prisma/client";
import { NotFoundError } from "@/middlewares/error.middleware";
import { prisma } from "@/lib/prisma";

export type NotificationRecipient =
  | { kind: "customer"; customerProfileId: string }
  | { kind: "worker"; workerId: string };

const paginate = (query: NotificationQueryDto) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

const listByScope = async (
  where: Prisma.NotificationWhereInput,
  query: NotificationQueryDto,
) => {
  const { skip, take, page, limit } = paginate(query);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const listCustomerNotifications = (
  userId: string,
  query: NotificationQueryDto,
) => listByScope({ customerProfile: { userId } }, query);

export const listWorkerNotifications = (
  userId: string,
  query: NotificationQueryDto,
) => listByScope({ worker: { userId } }, query);

export const getCustomerUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { customerProfile: { userId }, isRead: false },
  });
  return { count };
};

export const getWorkerUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { worker: { userId }, isRead: false },
  });
  return { count };
};

export const markCustomerNotificationAsRead = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, customerProfile: { userId } },
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markWorkerNotificationAsRead = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, worker: { userId } },
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllCustomerNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { customerProfile: { userId }, isRead: false },
    data: { isRead: true },
  });
  return { count: result.count };
};

export const markAllWorkerNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { worker: { userId }, isRead: false },
    data: { isRead: true },
  });
  return { count: result.count };
};

export const createNotification = async (
  recipient: NotificationRecipient,
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
) => {
  return prisma.notification.create({
    data: {
      ...(recipient.kind === "customer"
        ? { customerProfileId: recipient.customerProfileId }
        : { workerId: recipient.workerId }),
      title,
      message,
      type,
      link: link ?? null,
    },
  });
};
