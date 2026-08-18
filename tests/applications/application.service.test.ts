import { ApplicationStatus, JobStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import * as applicationService from "@/services/application.service";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    job: { findUnique: vi.fn(), update: vi.fn() },
    application: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("Application Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createApplication", () => {
    it("should throw if job is not found", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(
        applicationService.createApplication("worker-1", {
          jobId: "job-1",
          proposedPrice: 500,
          estimatedTime: 2,
        }),
      ).rejects.toThrow("Job not found");
    });

    it("should throw if job is not OPEN", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        status: JobStatus.ASSIGNED,
      } as never);

      await expect(
        applicationService.createApplication("worker-1", {
          jobId: "job-1",
          proposedPrice: 500,
          estimatedTime: 2,
        }),
      ).rejects.toThrow("Job is no longer open for applications");
    });

    it("should throw if worker already applied", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        status: JobStatus.OPEN,
      } as never);
      vi.mocked(prisma.application.findFirst).mockResolvedValue({
        id: "app-1",
      } as never);

      await expect(
        applicationService.createApplication("worker-1", {
          jobId: "job-1",
          proposedPrice: 500,
          estimatedTime: 2,
        }),
      ).rejects.toThrow("You have already applied for this job");
    });

    it("should successfully create application", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        status: JobStatus.OPEN,
      } as never);
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.application.create).mockResolvedValue({
        id: "new-app-1",
      } as never);

      const result = await applicationService.createApplication("worker-1", {
        jobId: "job-1",
        proposedPrice: 500,
        estimatedTime: 2,
      });

      expect(prisma.application.create).toHaveBeenCalledWith({
        data: {
          jobId: "job-1",
          workerId: "worker-1",
          proposedPrice: 500,
          estimatedTime: 2,
        },
      });
      expect(result.id).toBe("new-app-1");
    });
  });

  describe("acceptAndAssignJob", () => {
    it("should accept target app, reject others, and assign job", async () => {
      // Create a fake transaction client that just maps directly to prisma mock functions
      const txMock: Parameters<
        typeof applicationService.acceptAndAssignJob
      >[0] = {
        application: {
          findUnique: vi.fn().mockResolvedValue({
            id: "app-1",
            jobId: "job-1",
            workerId: "worker-1",
            status: ApplicationStatus.PENDING,
            job: { id: "job-1" },
          }),
          update: vi.fn().mockResolvedValue({
            id: "app-1",
            status: ApplicationStatus.ACCEPTED,
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        job: {
          update: vi.fn().mockResolvedValue({
            id: "job-1",
            assignedWorkerId: "worker-1",
            status: JobStatus.ASSIGNED,
          }),
        },
      } as unknown as Parameters<
        typeof applicationService.acceptAndAssignJob
      >[0];

      const result = await applicationService.acceptAndAssignJob(
        txMock,
        "app-1",
      );

      // Verify accepting the application
      expect(
        txMock.application.update as ReturnType<typeof vi.fn>,
      ).toHaveBeenCalledWith({
        where: { id: "app-1" },
        data: { status: ApplicationStatus.ACCEPTED },
      });

      // Verify rejecting others
      expect(
        txMock.application.updateMany as ReturnType<typeof vi.fn>,
      ).toHaveBeenCalledWith({
        where: {
          jobId: "job-1",
          id: { not: "app-1" },
          status: ApplicationStatus.PENDING,
        },
        data: { status: ApplicationStatus.REJECTED },
      });

      // Verify updating job
      expect(
        txMock.job.update as ReturnType<typeof vi.fn>,
      ).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: {
          assignedWorkerId: "worker-1",
          status: JobStatus.ASSIGNED,
        },
      });

      expect(result.acceptedApp.status).toBe(ApplicationStatus.ACCEPTED);
      expect(result.assignedJob.status).toBe(JobStatus.ASSIGNED);
    });
  });
  describe("withdrawApplication", () => {
    it("should throw if application not found", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);
      await expect(
        applicationService.withdrawApplication("worker-1", "app-1"),
      ).rejects.toThrow("Application not found");
    });

    it("should throw if user is not the owner", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        workerId: "other-worker",
      } as never);
      await expect(
        applicationService.withdrawApplication("worker-1", "app-1"),
      ).rejects.toThrow("Not authorized to withdraw this application");
    });

    it("should throw if application is not PENDING", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        workerId: "worker-1",
        status: ApplicationStatus.REJECTED,
      } as never);
      await expect(
        applicationService.withdrawApplication("worker-1", "app-1"),
      ).rejects.toThrow("Only pending applications can be withdrawn");
    });

    it("should delete application and return success", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        workerId: "worker-1",
        status: ApplicationStatus.PENDING,
      } as never);
      vi.mocked(prisma.application.delete).mockResolvedValue({
        id: "app-1",
      } as never);

      const result = await applicationService.withdrawApplication(
        "worker-1",
        "app-1",
      );

      expect(prisma.application.delete).toHaveBeenCalledWith({
        where: { id: "app-1" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getJobApplications", () => {
    it("should throw if job not found", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);
      await expect(
        applicationService.getJobApplications("cust-1", "job-1"),
      ).rejects.toThrow("Job not found");
    });

    it("should throw if customer does not own the job", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        customerId: "other-cust",
      } as never);
      await expect(
        applicationService.getJobApplications("cust-1", "job-1"),
      ).rejects.toThrow("Not authorized to view applications for this job");
    });

    it("should return applications", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        customerId: "cust-1",
      } as never);
      vi.mocked(prisma.application.findMany).mockResolvedValue([
        { id: "app-1" },
      ] as never);

      const result = await applicationService.getJobApplications(
        "cust-1",
        "job-1",
      );
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { jobId: "job-1" } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("rejectApplication", () => {
    it("should throw if application not found", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);
      await expect(
        applicationService.rejectApplication("cust-1", "app-1"),
      ).rejects.toThrow("Application not found");
    });

    it("should throw if customer does not own the job", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        job: { customerId: "other-cust" },
      } as never);
      await expect(
        applicationService.rejectApplication("cust-1", "app-1"),
      ).rejects.toThrow("Not authorized to reject this application");
    });

    it("should throw if application is not PENDING", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        status: ApplicationStatus.ACCEPTED,
        job: { customerId: "cust-1" },
      } as never);
      await expect(
        applicationService.rejectApplication("cust-1", "app-1"),
      ).rejects.toThrow("Application is not in a pending state");
    });

    it("should reject the application", async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        status: ApplicationStatus.PENDING,
        job: { customerId: "cust-1" },
      } as never);
      vi.mocked(prisma.application.update).mockResolvedValue({
        id: "app-1",
        status: ApplicationStatus.REJECTED,
      } as never);

      const result = await applicationService.rejectApplication(
        "cust-1",
        "app-1",
      );
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: "app-1" },
        data: { status: ApplicationStatus.REJECTED },
      });
      expect(result.status).toBe(ApplicationStatus.REJECTED);
    });
  });
});
