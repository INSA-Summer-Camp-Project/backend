import type { SystemRole } from "@prisma/client";
import type { AdminUserQueryDto, CreateCategoryDto } from "@/dtos/admin.dto";
import { NotFoundError, ConflictError } from "@/middlewares/error.middleware";
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

export const updateUserRole = async (userId: string, role: SystemRole) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  return prisma.user.update({
    where: { id: userId },
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
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category not found");
  return prisma.category.delete({ where: { id } });
};
