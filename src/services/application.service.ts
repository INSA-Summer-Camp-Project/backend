import { ApplicationStatus, JobStatus, Prisma } from "@prisma/client";

import type { CreateApplicationDto } from "@/dtos/application.dto";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/errors";
import { prisma } from "@/lib/prisma";

export const createApplication = async (
  workerId: string,
  dto: CreateApplicationDto,
) => {
  // Ensure the job exists and is OPEN
  const job = await prisma.job.findUnique({
    where: { id: dto.jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.status !== JobStatus.OPEN) {
    throw new Error("Job is no longer open for applications");
  }

  // Ensure worker hasn't already applied
  const existingApplication = await prisma.application.findFirst({
    where: {
      jobId: dto.jobId,
      workerId,
    },
  });

  if (existingApplication) {
    throw new Error("You have already applied for this job");
  }

  const application = await prisma.application.create({
    data: {
      jobId: dto.jobId,
      workerId,
      proposedPrice: dto.proposedPrice,
      estimatedTime: dto.estimatedTime,
    },
  });

  return application;
};

export const getWorkerApplications = async (workerId: string) => {
  return await prisma.application.findMany({
    where: { workerId },
    include: {
      job: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const withdrawApplication = async (workerId: string, id: string) => {
  const application = await prisma.application.findUnique({
    where: { id },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.workerId !== workerId) {
    throw new Error("Not authorized to withdraw this application");
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new Error("Only pending applications can be withdrawn");
  }

  await prisma.application.delete({
    where: { id },
  });

  return { success: true };
};

export const getJobApplications = async (customerId: string, jobId: string) => {
  // Ensure the customer owns the job
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.customerId !== customerId) {
    throw new Error("Not authorized to view applications for this job");
  }

  return await prisma.application.findMany({
    where: { jobId },
    include: {
      worker: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const rejectApplication = async (customerId: string, id: string) => {
  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.job.customerId !== customerId) {
    throw new Error("Not authorized to reject this application");
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new Error("Application is not in a pending state");
  }

  const rejectedApp = await prisma.application.update({
    where: { id },
    data: { status: ApplicationStatus.REJECTED },
  });

  return rejectedApp;
};

export const acceptAndAssignJob = async (
  tx: Prisma.TransactionClient,
  applicationId: string,
) => {
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // 1. Accept the target application
  const acceptedApp = await tx.application.update({
    where: { id: applicationId },
    data: { status: ApplicationStatus.ACCEPTED },
  });

  // 2. Reject all other pending applications for this job
  await tx.application.updateMany({
    where: {
      jobId: application.jobId,
      id: { not: applicationId },
      status: ApplicationStatus.PENDING,
    },
    data: { status: ApplicationStatus.REJECTED },
  });

  // 3. Assign the worker and mark the job as ASSIGNED
  const assignedJob = await tx.job.update({
    where: { id: application.jobId },
    data: {
      assignedWorkerId: application.workerId,
      status: JobStatus.ASSIGNED,
    },
  });

  return { acceptedApp, assignedJob };
};

export const acceptApplication = async (
  customerId: string,
  applicationId: string,
) => {
  // 1. Find application and verify customer owns the job
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.job.customerId !== customerId) {
    throw new ForbiddenError("Not authorized to accept this application");
  }

  // 2. Verify job is OPEN
  if (application.job.status !== JobStatus.OPEN) {
    throw new BadRequestError("Job is no longer open");
  }

  // 3. Verify application is PENDING
  if (application.status !== ApplicationStatus.PENDING) {
    throw new BadRequestError("Application is not in a pending state");
  }

  // 4. Wrap acceptAndAssignJob in a transaction
  const result = await prisma.$transaction(async (tx) => {
    return acceptAndAssignJob(tx, applicationId);
  });

  return result;
};
