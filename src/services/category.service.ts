import { prisma } from "@/lib/prisma";
import { ConflictError } from "@/middlewares/error.middleware";
import type { CreateCategoryDto } from "@/dtos/category.dto";

export const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const createCategory = async (data: CreateCategoryDto) => {
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError(`Category '${data.name}' already exists`);
  }

  return prisma.category.create({
    data: {
      name: data.name,
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};
