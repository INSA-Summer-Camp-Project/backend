import {
  type JobSource,
  type ApplicationStatus,
  type JobStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from "@/middlewares/error.middleware";
import { createNotification } from "@/services/notification.service";
import type { CreateApplicationDto } from "@/dtos/application.dto";

// ---------------------------------------------------------------------------
// Enum literals (forward-compatible: these will exist after Phase-4 migration)
// ---------------------------------------------------------------------------
const JOB_SOURCE_POSTING = "POSTING" as JobSource;
const JOB_STATUS_OPEN = "OPEN" as JobStatus;
const JOB_STATUS_IN_PROGRESS = "IN_PROGRESS" as JobStatus;
const APP_STATUS_PENDING = "PENDING" as ApplicationStatus;
const APP_STATUS_ACCEPTED = "ACCEPTED" as ApplicationStatus;
const APP_STATUS_REJECTED = "REJECTED" as ApplicationStatus;
const APP_STATUS_WITHDRAWN = "WITHDRAWN" as ApplicationStatus;

// ---------------------------------------------------------------------------
// Shared select shapes
// ---------------------------------------------------------------------------
const workerPublicSelect = {
  id: true,
  userId: true,
  profilePhoto: true,
  ratingAvg: true,
  experienceYears: true,
  user: { select: { id: true, name: true } },
};

const categorySelect = { id: true, name: true };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getWorkerOrThrow = async (userId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!worker) throw new ForbiddenError("Worker profile not found");
  return worker;
};

const getCustomerProfileOrThrow = async (userId: string) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!profile) throw new ForbiddenError("Customer profile not found");
  return profile;
};

// ---------------------------------------------------------------------------
// 1. Worker submits a bid
// ---------------------------------------------------------------------------
export const applyToJob = async (
  userId: string,
  jobId: string,
  data: CreateApplicationDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { customer: { select: { id: true, userId: true } } },
  });

  if (!job) throw new NotFoundError("Job not found");

  // State machine guard: only POSTING + OPEN jobs accept bids
  if (job.source !== JOB_SOURCE_POSTING) {
    throw new BadRequestError(
      "Bids can only be submitted to marketplace job postings",
    );
  }
  if (job.status !== JOB_STATUS_OPEN) {
    throw new BadRequestError("Bids can only be submitted to OPEN jobs");
  }

  // Anti-self-bidding guard
  if (job.customer.userId === userId) {
    throw new BadRequestError("Cannot apply to your own job listing");
  }

  // Duplicate bid guard
  const existing = await prisma.application.findFirst({
    where: { jobId, workerId: worker.id },
  });
  if (existing) {
    throw new ConflictError("You have already submitted a bid on this job");
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      workerId: worker.id,
      proposedPrice: data.proposedPrice,
      estimatedTime: data.estimatedTime,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          category: { select: categorySelect },
        },
      },
      worker: { select: workerPublicSelect },
    },
  });

  // Notify customer of the new proposal
  await createNotification(
    { kind: "customer", customerProfileId: job.customer.id },
    "New Proposal Received",
    `${worker.user?.name || "A worker"} submitted a proposal of ${data.proposedPrice} ETB for "${job.title}".`,
    "NEW_PROPOSAL",
    `/customer/jobs/${job.id}`,
  ).catch(() => {});

  return application;
};

// ---------------------------------------------------------------------------
// 2. Customer views bids on their job
// ---------------------------------------------------------------------------
export const getJobApplications = async (userId: string, jobId: string) => {
  const profile = await getCustomerProfileOrThrow(userId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { customerId: true },
  });
  if (!job) throw new NotFoundError("Job not found");
  if (job.customerId !== profile.id) {
    throw new ForbiddenError("You do not own this job");
  }

  return prisma.application.findMany({
    where: { jobId },
    include: {
      worker: { select: workerPublicSelect },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ---------------------------------------------------------------------------
// 3. Worker views their own applications / bids
// ---------------------------------------------------------------------------
export const getMyApplications = async (userId: string) => {
  const worker = await getWorkerOrThrow(userId);

  return prisma.application.findMany({
    where: { workerId: worker.id },
    include: {
      job: {
        include: {
          category: { select: categorySelect },
          customer: { select: { id: true, user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ---------------------------------------------------------------------------
// 4. Customer accepts a bid — atomic transaction
// ---------------------------------------------------------------------------
export const acceptApplication = async (
  userId: string,
  applicationId: string,
) => {
  const profile = await getCustomerProfileOrThrow(userId);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      worker: { select: { id: true, userId: true } },
    },
  });

  if (!application) throw new NotFoundError("Application not found");

  if (application.job.customerId !== profile.id) {
    throw new ForbiddenError("You do not own the job this bid belongs to");
  }

  if (application.job.status !== JOB_STATUS_OPEN) {
    throw new BadRequestError("Bids can only be accepted when the job is OPEN");
  }
  if (application.status !== APP_STATUS_PENDING) {
    throw new BadRequestError("Only PENDING bids can be accepted");
  }

  const [acceptedApp, , updatedJob] = await prisma.$transaction([
    // 1. Mark winning bid ACCEPTED
    prisma.application.update({
      where: { id: applicationId },
      data: { status: APP_STATUS_ACCEPTED },
      include: { worker: { select: workerPublicSelect } },
    }),
    // 2. Reject all other competing bids
    prisma.application.updateMany({
      where: {
        jobId: application.jobId,
        id: { not: applicationId },
        status: APP_STATUS_PENDING,
      },
      data: { status: APP_STATUS_REJECTED },
    }),
    // 3. Assign worker, lock budget, transition job to IN_PROGRESS
    prisma.job.update({
      where: { id: application.jobId },
      data: {
        assignedWorkerId: application.workerId,
        budget: application.proposedPrice,
        status: JOB_STATUS_IN_PROGRESS,
      },
      include: {
        category: { select: categorySelect },
        assignedWorker: { select: workerPublicSelect },
        customer: { select: { id: true, user: { select: { name: true } } } },
      },
    }),
  ]);

  // Notify winning worker
  await createNotification(
    { kind: "worker", workerId: application.worker.id },
    "Proposal Accepted! 🎉",
    `Your proposal for "${updatedJob.title}" has been accepted! You can now view client contact details.`,
    "PROPOSAL_ACCEPTED",
    `/worker/jobs/${updatedJob.id}`,
  ).catch(() => {});

  return { application: acceptedApp, job: updatedJob };
};

// ---------------------------------------------------------------------------
// 5. Customer rejects a bid
// ---------------------------------------------------------------------------
export const rejectApplication = async (
  userId: string,
  applicationId: string,
) => {
  const profile = await getCustomerProfileOrThrow(userId);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: { id: true, title: true, customerId: true, status: true },
      },
      worker: { select: { id: true, userId: true } },
    },
  });
  if (!application) throw new NotFoundError("Application not found");
  if (application.job.customerId !== profile.id) {
    throw new ForbiddenError("You do not own the job this bid belongs to");
  }

  const rejected = await prisma.application.update({
    where: { id: applicationId },
    data: { status: APP_STATUS_REJECTED },
  });

  await createNotification(
    { kind: "worker", workerId: application.worker.id },
    "Proposal Update",
    `Your proposal for "${application.job.title}" was not accepted.`,
    "PROPOSAL_REJECTED",
    `/worker/jobs/${application.job.id}`,
  ).catch(() => {});

  return rejected;
};

// ---------------------------------------------------------------------------
// 6. Worker withdraws their bid
// ---------------------------------------------------------------------------
export const withdrawApplication = async (
  userId: string,
  applicationId: string,
) => {
  const worker = await getWorkerOrThrow(userId);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new NotFoundError("Application not found");
  if (application.workerId !== worker.id) {
    throw new ForbiddenError("You do not own this bid");
  }
  if (application.status !== APP_STATUS_PENDING) {
    throw new BadRequestError("Only PENDING bids can be withdrawn");
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status: APP_STATUS_WITHDRAWN },
  });
};
