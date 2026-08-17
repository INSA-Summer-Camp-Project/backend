import { prisma } from "@/lib/prisma";

export const getAllCategories = async () => {
  return prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
  });
};
