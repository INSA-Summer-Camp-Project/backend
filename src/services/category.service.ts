import { prisma } from "@/lib/prisma";

export type ServiceCategoryDto = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export const getAllCategories = async (): Promise<ServiceCategoryDto[]> => {
  return prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
  });
};

export const createCategory = async (
  name: string,
): Promise<ServiceCategoryDto> => {
  return prisma.serviceCategory.create({
    data: { name },
  });
};
