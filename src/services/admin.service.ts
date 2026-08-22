import type { SystemRole } from "@prisma/client";
import type { AdminUserQueryDto, CreateCategoryDto } from "@/dtos/admin.dto";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "@/middlewares/error.middleware";
import { prisma } from "@/lib/prisma";

export const getDashboardStats = async () => {
  const [totalUsers, totalJobs, openJobs, completedJobs, successfulPayments] =
    await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
    ]);
  return {
    totalUsers,
    totalJobs,
    openJobs,
    completedJobs,
    totalPaymentVolume: successfulPayments._sum.amount || 0,
  };
};

export const getAllUsers = async (query: AdminUserQueryDto) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = query.role ? { systemRole: query.role } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        systemRole: true,
        lastActiveRole: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateUserRole = async (
  adminUserId: string,
  targetUserId: string,
  role: SystemRole,
) => {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError("User not found");

  if (adminUserId === targetUserId && role !== "ADMIN") {
    throw new BadRequestError("Admins cannot demote themselves");
  }

  if (user.systemRole === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { systemRole: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new BadRequestError("Cannot demote the only remaining admin");
    }
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { systemRole: role },
    select: { id: true, name: true, systemRole: true },
  });
};

export const createCategory = async (data: CreateCategoryDto) => {
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw new ConflictError(`Category '${data.name}' already exists`);
  }
  return prisma.category.create({ data: { name: data.name } });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          jobs: true,
          services: true,
        },
      },
    },
  });

  if (!category) throw new NotFoundError("Category not found");

  if (category._count.jobs > 0 || category._count.services > 0) {
    throw new ConflictError(
      "Cannot delete category with associated jobs or services",
    );
  }

  return prisma.category.delete({ where: { id } });
};
