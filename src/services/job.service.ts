import { Prisma, type JobSource, type JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from "@/middlewares/error.middleware";
import type {
  CreateJobDto,
  CreateDirectJobDto,
  JobQueryDto,
  UpdateJobDto,
  DirectRespondDto,
  UpdateJobStatusDto,
} from "@/dtos/job.dto";

// ---------------------------------------------------------------------------
// Enum literal constants — forward-compatible with Phase-4 migration.
// The `as` casts bridge the gap while the stale Prisma client is in use.
// ---------------------------------------------------------------------------
const JOB_SOURCE_POSTING = "POSTING" as JobSource;
const JOB_SOURCE_DIRECT = "DIRECT" as JobSource;
const JOB_STATUS_OPEN = "OPEN" as JobStatus;
const JOB_STATUS_PENDING = "PENDING" as JobStatus;
const JOB_STATUS_IN_PROGRESS = "IN_PROGRESS" as JobStatus;
const JOB_STATUS_COMPLETED = "COMPLETED" as JobStatus;
const JOB_STATUS_CANCELLED = "CANCELLED" as JobStatus;
const JOB_STATUS_DECLINED = "DECLINED" as JobStatus;

// ---------------------------------------------------------------------------
// Shared select shapes
// ---------------------------------------------------------------------------

const categorySelect = { id: true, name: true };

const workerPublicSelect = {
  id: true,
  userId: true,
  profilePhoto: true,
  ratingAvg: true,
  experienceYears: true,
  user: { select: { id: true, name: true } },
};

const customerPublicSelect = {
  id: true,
  userId: true,
  user: { select: { id: true, name: true } },
};

// ---------------------------------------------------------------------------
// Helper: resolve customerProfile.id from auth userId
// ---------------------------------------------------------------------------
const getCustomerProfileOrThrow = async (userId: string) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw new ForbiddenError("Customer profile not found for this user");
  }
  return profile;
};

// ---------------------------------------------------------------------------
// Helper: resolve Worker row from auth userId
// ---------------------------------------------------------------------------
const getWorkerOrThrow = async (userId: string) => {
  const worker = await prisma.worker.findUnique({ where: { userId } });
  if (!worker) {
    throw new ForbiddenError("Worker profile not found for this user");
  }
  return worker;
};

// ---------------------------------------------------------------------------
// Helper: fetch a Job by id and throw 404 if missing
// ---------------------------------------------------------------------------
const getJobOrThrow = async (jobId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new NotFoundError("Job not found");
  }
  return job;
};

// ---------------------------------------------------------------------------
// 1. Create marketplace posting
// ---------------------------------------------------------------------------
export const createJob = async (userId: string, data: CreateJobDto) => {
  const customerProfile = await getCustomerProfileOrThrow(userId);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new NotFoundError("Category not found");

  return prisma.job.create({
    data: {
      customerId: customerProfile.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      budget: data.budget,
      source: JOB_SOURCE_POSTING,
      status: JOB_STATUS_OPEN,
    },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
    },
  });
};

// ---------------------------------------------------------------------------
// 2. Create direct-hire booking
// ---------------------------------------------------------------------------
export const createDirectJob = async (
  userId: string,
  data: CreateDirectJobDto,
) => {
  const customerProfile = await getCustomerProfileOrThrow(userId);

  // Anti-self-hire guard
  const targetWorker = await prisma.worker.findUnique({
    where: { id: data.targetWorkerId },
    select: { id: true, userId: true },
  });
  if (!targetWorker) throw new NotFoundError("Target worker not found");
  if (targetWorker.userId === userId) {
    throw new BadRequestError("Cannot book your own worker profile");
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new NotFoundError("Category not found");

  return prisma.job.create({
    data: {
      customerId: customerProfile.id,
      categoryId: data.categoryId,
      targetWorkerId: data.targetWorkerId,
      title: data.title,
      description: data.description,
      budget: data.budget,
      source: JOB_SOURCE_DIRECT,
      status: JOB_STATUS_PENDING,
    },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
      targetWorker: { select: workerPublicSelect },
    },
  });
};

// ---------------------------------------------------------------------------
// 3. Public marketplace listing (source=POSTING, status=OPEN)
// ---------------------------------------------------------------------------
export const getPublicJobs = async (query: JobQueryDto) => {
  const { categoryId, minBudget, maxBudget, q, page, limit } = query;

  const AND: Prisma.JobWhereInput[] = [
    { source: JOB_SOURCE_POSTING },
    { status: JOB_STATUS_OPEN },
  ];

  if (categoryId) AND.push({ categoryId });
  if (minBudget !== undefined) AND.push({ budget: { gte: minBudget } });
  if (maxBudget !== undefined) AND.push({ budget: { lte: maxBudget } });
  if (q?.trim()) {
    const trimmed = q.trim();
    AND.push({
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
      ],
    });
  }

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: { AND },
      include: {
        category: { select: categorySelect },
        customer: { select: customerPublicSelect },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where: { AND } }),
  ]);

  return {
    jobs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ---------------------------------------------------------------------------
// 4. My jobs (role-aware)
// ---------------------------------------------------------------------------
export const getMyJobs = async (
  userId: string,
  lastActiveRole: "CUSTOMER" | "WORKER" | null,
) => {
  if (lastActiveRole === "CUSTOMER") {
    const profile = await getCustomerProfileOrThrow(userId);
    return prisma.job.findMany({
      where: { customerId: profile.id },
      include: {
        category: { select: categorySelect },
        targetWorker: { select: workerPublicSelect },
        assignedWorker: { select: workerPublicSelect },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // WORKER view
  const worker = await getWorkerOrThrow(userId);
  return prisma.job.findMany({
    where: {
      OR: [{ targetWorkerId: worker.id }, { assignedWorkerId: worker.id }],
    },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ---------------------------------------------------------------------------
// 5. Get single job by id
// ---------------------------------------------------------------------------
export const getJobById = async (jobId: string, requestUserId?: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      category: { select: categorySelect },
      customer: {
        select: {
          ...customerPublicSelect,
          userId: true,
        },
      },
      assignedWorker: { select: workerPublicSelect },
      targetWorker: { select: workerPublicSelect },
    },
  });
  if (!job) throw new NotFoundError("Job not found");

  // If requester is the job owner, attach full applications list
  if (requestUserId) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: requestUserId },
      select: { id: true },
    });
    if (profile && profile.id === job.customerId) {
      const applications = await prisma.application.findMany({
        where: { jobId },
        include: {
          worker: { select: workerPublicSelect },
        },
        orderBy: { createdAt: "desc" },
      });
      return { ...job, applications };
    }
  }

  return job;
};

// ---------------------------------------------------------------------------
// 6. Update job (only if OPEN)
// ---------------------------------------------------------------------------
export const updateJob = async (
  userId: string,
  jobId: string,
  data: UpdateJobDto,
) => {
  const profile = await getCustomerProfileOrThrow(userId);
  const job = await getJobOrThrow(jobId);

  if (job.customerId !== profile.id) {
    throw new ForbiddenError("You do not own this job");
  }
  if (job.status !== JOB_STATUS_OPEN) {
    throw new BadRequestError(
      "Job can only be edited when it is in OPEN status",
    );
  }

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!cat) throw new NotFoundError("Category not found");
  }

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.budget !== undefined && { budget: data.budget }),
    },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
    },
  });
};

// ---------------------------------------------------------------------------
// 7. Worker responds to a direct booking
// ---------------------------------------------------------------------------
export const respondToDirectJob = async (
  userId: string,
  jobId: string,
  data: DirectRespondDto,
) => {
  const worker = await getWorkerOrThrow(userId);
  const job = await getJobOrThrow(jobId);

  if (job.source !== JOB_SOURCE_DIRECT) {
    throw new BadRequestError("This endpoint is only for direct booking jobs");
  }
  if (job.status !== JOB_STATUS_PENDING) {
    throw new BadRequestError(
      "Direct booking can only be responded to when status is PENDING",
    );
  }
  if (job.targetWorkerId !== worker.id) {
    throw new ForbiddenError("You are not the target worker for this job");
  }

  if (data.action === "ACCEPT") {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: JOB_STATUS_IN_PROGRESS, assignedWorkerId: worker.id },
      include: {
        category: { select: categorySelect },
        customer: { select: customerPublicSelect },
        assignedWorker: { select: workerPublicSelect },
      },
    });
  }

  // DECLINE
  return prisma.job.update({
    where: { id: jobId },
    data: { status: JOB_STATUS_DECLINED },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
    },
  });
};

// ---------------------------------------------------------------------------
// 8. Patch job status (COMPLETED / CANCELLED)
// ---------------------------------------------------------------------------
export const updateJobStatus = async (
  userId: string,
  jobId: string,
  data: UpdateJobStatusDto,
) => {
  const job = await getJobOrThrow(jobId);

  const TERMINAL_STATES: JobStatus[] = [
    JOB_STATUS_COMPLETED,
    JOB_STATUS_CANCELLED,
    JOB_STATUS_DECLINED,
  ];
  if (TERMINAL_STATES.includes(job.status)) {
    throw new BadRequestError(
      `Job is already in a terminal state (${job.status}) and cannot be changed`,
    );
  }

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: { id: true },
  });

  const isCustomer = customerProfile && job.customerId === customerProfile.id;
  const isAssignedWorker = worker && job.assignedWorkerId === worker.id;

  if (!isCustomer && !isAssignedWorker) {
    throw new ForbiddenError(
      "Only the job owner (customer) or the assigned worker can update this status",
    );
  }

  if (data.status === "CANCELLED" && !isCustomer) {
    throw new ForbiddenError("Only the customer can cancel a job");
  }

  if (data.status === ("IN_PROGRESS" as JobStatus)) {
    throw new BadRequestError(
      "IN_PROGRESS transition is handled by the bid acceptance or direct-respond endpoints",
    );
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: data.status as JobStatus },
    include: {
      category: { select: categorySelect },
      customer: { select: customerPublicSelect },
      assignedWorker: { select: workerPublicSelect },
    },
  });
};

// Barrel re-export (used by application.service)
export { ConflictError };
