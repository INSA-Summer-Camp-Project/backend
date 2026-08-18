import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import * as jobService from "@/services/job.service";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customerProfile: { findUnique: vi.fn() },
    workerProfile: { findUnique: vi.fn() },
    job: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Job Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createJob", () => {
    it("should throw if customer profile not found", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue(null);

      await expect(
        jobService.createJob("user-1", {
          title: "Test",
          description: "Desc",
          categoryId: "cat-1",
          budget: 100,
        }),
      ).rejects.toThrow("Customer profile not found");
    });

    it("should create a marketplace job if no target worker", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue({
        id: "cust-1",
      } as never);
      vi.mocked(prisma.job.create).mockResolvedValue({
        id: "job-1",
        source: "MARKETPLACE",
      } as never);

      const result = await jobService.createJob("user-1", {
        title: "Test",
        description: "Desc",
        categoryId: "cat-1",
        budget: 100,
      });

      expect(prisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: "cust-1",
            source: "MARKETPLACE",
          }),
        }),
      );
      expect(result.id).toBe("job-1");
    });
  });

  describe("getPublicJobs", () => {
    it("should return paginated open jobs", async () => {
      vi.mocked(prisma.job.count).mockResolvedValue(10);
      vi.mocked(prisma.job.findMany).mockResolvedValue([
        { id: "job-1" },
      ] as never);

      const result = await jobService.getPublicJobs({ page: 2, limit: 5 });

      expect(prisma.job.count).toHaveBeenCalledWith({
        where: { status: "OPEN", source: "MARKETPLACE" },
      });
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "OPEN", source: "MARKETPLACE" },
          skip: 5,
          take: 5,
        }),
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.page).toBe(2);
    });
  });
  describe("getCustomerJobs", () => {
    it("should return jobs for customer", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue({
        id: "cust-1",
      } as never);
      vi.mocked(prisma.job.findMany).mockResolvedValue([
        { id: "job-1" },
      ] as never);

      const result = await jobService.getCustomerJobs("user-1");

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: "cust-1" } }),
      );
      expect(result).toHaveLength(1);
    });

    it("should throw if customer profile not found", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue(null);

      await expect(jobService.getCustomerJobs("user-1")).rejects.toThrow(
        "Customer profile not found",
      );
    });
  });

  describe("getWorkerJobs", () => {
    it("should return jobs for worker", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue({
        id: "work-1",
      } as never);
      vi.mocked(prisma.job.findMany).mockResolvedValue([
        { id: "job-1" },
      ] as never);

      const result = await jobService.getWorkerJobs("user-1");

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { assignedWorkerId: "work-1" } }),
      );
      expect(result).toHaveLength(1);
    });

    it("should throw if worker profile not found", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue(null);

      await expect(jobService.getWorkerJobs("user-1")).rejects.toThrow(
        "Worker profile not found",
      );
    });
  });

  describe("getJobById", () => {
    it("should throw if job not found", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(jobService.getJobById("user-1", "job-1")).rejects.toThrow(
        "Job not found",
      );
    });

    it("should return job with applications if user is owner", async () => {
      const mockJob = {
        id: "job-1",
        customer: { userId: "user-1" },
        applications: [{ id: "app-1" }],
      };
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as never);

      const result = await jobService.getJobById("user-1", "job-1");

      expect(result.applications).toHaveLength(1);
    });

    it("should hide applications if user is not owner", async () => {
      const mockJob = {
        id: "job-1",
        customer: { userId: "owner-user" },
        applications: [{ id: "app-1" }],
      };
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as never);

      const result = await jobService.getJobById("other-user", "job-1");

      expect(result.applications).toHaveLength(0);
    });

    it("should hide applications if userId is undefined", async () => {
      const mockJob = {
        id: "job-1",
        customer: { userId: "owner-user" },
        applications: [{ id: "app-1" }],
      };
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as never);

      const result = await jobService.getJobById(undefined, "job-1");

      expect(result.applications).toHaveLength(0);
    });
  });

  describe("updateJobStatus", () => {
    it("should throw if customer profile not found", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue(null);

      await expect(
        jobService.updateJobStatus("user-1", "job-1", { status: "COMPLETED" }),
      ).rejects.toThrow("Customer profile not found");
    });

    it("should throw if job not found or not owned by customer", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue({
        id: "cust-1",
      } as never);
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        customerId: "other-cust",
      } as never);

      await expect(
        jobService.updateJobStatus("user-1", "job-1", { status: "COMPLETED" }),
      ).rejects.toThrow("Job not found or access denied");
    });

    it("should successfully update job status", async () => {
      vi.mocked(prisma.customerProfile.findUnique).mockResolvedValue({
        id: "cust-1",
      } as never);
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        customerId: "cust-1",
      } as never);
      vi.mocked(prisma.job.update).mockResolvedValue({
        id: "job-1",
        status: "COMPLETED",
      } as never);

      const result = await jobService.updateJobStatus("user-1", "job-1", {
        status: "COMPLETED",
      });

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "COMPLETED" },
      });
      expect(result.status).toBe("COMPLETED");
    });
  });
});
