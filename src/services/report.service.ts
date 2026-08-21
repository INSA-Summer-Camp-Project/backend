import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/middlewares/error.middleware";
import type { CreateReportDto, UpdateReportStatusDto } from "@/dtos/report.dto";
import type { ReportStatus } from "@prisma/client";

/**
 * Creates a new report.
 */
export const createReport = async (
  reporterId: string,
  data: CreateReportDto,
) => {
  // Ensure the reported user exists
  const reportedUser = await prisma.user.findUnique({
    where: { id: data.reportedId },
  });

  if (!reportedUser) {
    throw new NotFoundError("Reported user not found");
  }

  // If a job is provided, ensure it exists and the reporter is part of it
  if (data.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      include: {
        customer: true,
        assignedWorker: true,
      },
    });

    if (!job) {
      throw new NotFoundError("Job not found");
    }

    const isCustomer = job.customer.userId === reporterId;
    const isWorker = job.assignedWorker?.userId === reporterId;

    if (!isCustomer && !isWorker) {
      throw new ForbiddenError("You are not part of this job");
    }
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedId: data.reportedId,
      jobId: data.jobId ?? null,
      reason: data.reason,
      description: data.description,
    },
  });

  return report;
};

/**
 * Gets all reports submitted by a specific user.
 */
export const getReportsByUser = async (userId: string) => {
  return await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      reported: {
        select: { id: true, name: true, role: true },
      },
      job: {
        select: { id: true, title: true },
      },
    },
  });
};

/**
 * Gets all reports for the admin dashboard.
 */
export const getAllReports = async (query: { status?: ReportStatus }) => {
  return await prisma.report.findMany({
    where: { ...(query.status && { status: query.status }) },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, role: true },
      },
      reported: {
        select: { id: true, name: true, role: true },
      },
      job: {
        select: { id: true, title: true },
      },
    },
  });
};

/**
 * Updates the status of a report. (Admin only)
 */
export const updateReportStatus = async (
  reportId: string,
  data: UpdateReportStatusDto,
) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  return await prisma.report.update({
    where: { id: reportId },
    data: { status: data.status },
  });
};
