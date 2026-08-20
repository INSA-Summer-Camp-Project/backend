import { JobStatus } from "@prisma/client";

import type { PaginationDto } from "@/dtos/common.dto";
import { getPaginationMeta } from "@/dtos/common.dto";
import type { CreateJobDto, UpdateJobStatusDto } from "@/dtos/job.dto";
import { NotFoundError, ForbiddenError, BadRequestError } from "@/errors";
import { prisma } from "@/lib/prisma";

export const createJob = async (userId: string, dto: CreateJobDto) => {
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new NotFoundError("Customer profile not found");
  }

  const source = dto.targetWorkerId ? "DIRECT_HIRE" : "MARKETPLACE";

  return prisma.job.create({
    data: {
      customerId: customerProfile.id,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      budget: dto.budget,
      source,
      targetWorkerId: dto.targetWorkerId ?? null,
    },
    include: {
      category: true,
    },
  });
};

export const getCustomerJobs = async (userId: string) => {
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new NotFoundError("Customer profile not found");
  }

  return prisma.job.findMany({
    where: { customerId: customerProfile.id },
    include: {
      category: true,
      assignedWorker: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getWorkerJobs = async (userId: string) => {
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
  });

  if (!workerProfile) {
    throw new NotFoundError("Worker profile not found");
  }

  return prisma.job.findMany({
    where: { assignedWorkerId: workerProfile.id },
    include: {
      category: true,
      customer: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getPublicJobs = async (
  pagination: PaginationDto,
  categoryId?: string,
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: "OPEN" as const,
    source: "MARKETPLACE" as const,
    ...(categoryId && { categoryId }),
  };

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        customer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data: jobs,
    meta: getPaginationMeta(page, limit, total),
  };
};

export const getJobById = async (userId: string | undefined, jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      category: true,
      customer: { include: { user: { select: { name: true } } } },
      assignedWorker: { include: { user: { select: { name: true } } } },
      applications: {
        include: { worker: { include: { user: { select: { name: true } } } } },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  // If the requester is NOT the job owner, hide applications (unless they applied, but we'll simplify and hide them)
  if (!userId || job.customer.userId !== userId) {
    job.applications = [];
  }

  return job;
};

export const updateJobStatus = async (
  userId: string,
  jobId: string,
  dto: UpdateJobStatusDto,
) => {
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new NotFoundError("Customer profile not found");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job || job.customerId !== customerProfile.id) {
    throw new NotFoundError("Job not found or access denied");
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: dto.status },
  });
};

export const completeJob = async (userId: string, jobId: string) => {
  // 1. Find customer profile from userId
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new NotFoundError("Customer profile not found");
  }

  // 2. Find job, verify customer owns it
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job || job.customerId !== customerProfile.id) {
    throw new NotFoundError("Job not found or access denied");
  }

  // 3. Verify job.status === "ASSIGNED"
  if (job.status !== JobStatus.ASSIGNED) {
    throw new BadRequestError("Job is not in ASSIGNED status");
  }

  // 4. Set job.status → "COMPLETED"
  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.COMPLETED },
  });

  return updatedJob;
};
