import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/middlewares/error.middleware";
import type { UpdateCustomerProfileDto } from "@/dtos/customer.dto";

const customerSelect = {
  id: true,
  userId: true,
  bio: true,
  profilePhoto: true,
  ratingAvg: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },
};

export const getMyCustomerProfile = async (userId: string) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: customerSelect,
  });

  if (!profile) {
    throw new NotFoundError("Customer profile not found");
  }

  const [totalJobsPosted, totalCompletedJobs] = await Promise.all([
    prisma.job.count({ where: { customerId: profile.id } }),
    prisma.job.count({
      where: { customerId: profile.id, status: "COMPLETED" },
    }),
  ]);

  return {
    ...profile,
    ratingAvg: Number(profile.ratingAvg),
    totalJobsPosted,
    totalCompletedJobs,
  };
};

export const updateMyCustomerProfile = async (
  userId: string,
  data: UpdateCustomerProfileDto,
) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new NotFoundError("Customer profile not found");
  }

  const updated = await prisma.customerProfile.update({
    where: { id: profile.id },
    data: {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.profilePhoto !== undefined && {
        profilePhoto: data.profilePhoto,
      }),
    },
    select: customerSelect,
  });

  return {
    ...updated,
    ratingAvg: Number(updated.ratingAvg),
  };
};

export const getCustomerById = async (customerProfileId: string) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
      ...customerSelect,
      reviews: {
        where: { reviewerRole: "WORKER_TO_CUSTOMER" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          worker: {
            select: {
              id: true,
              profilePhoto: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    throw new NotFoundError("Customer not found");
  }

  const [totalJobsPosted, totalCompletedJobs] = await Promise.all([
    prisma.job.count({ where: { customerId: profile.id } }),
    prisma.job.count({
      where: { customerId: profile.id, status: "COMPLETED" },
    }),
  ]);

  return {
    ...profile,
    ratingAvg: Number(profile.ratingAvg),
    totalJobsPosted,
    totalCompletedJobs,
  };
};
