import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/errors";
import { prisma } from "@/lib/prisma";
import * as workerService from "@/services/worker.service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Worker Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkers", () => {
    it("should return paginated workers", async () => {
      vi.mocked(prisma.workerProfile.count).mockResolvedValue(10);
      vi.mocked(prisma.workerProfile.findMany).mockResolvedValue([
        { id: "worker-1" },
      ] as never);

      const result = await workerService.getWorkers({ page: 2, limit: 5 });

      expect(prisma.workerProfile.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.workerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 5,
          take: 5,
          orderBy: { averageRating: "desc" },
        }),
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.page).toBe(2);
    });

    it("should filter workers by categoryId if provided", async () => {
      vi.mocked(prisma.workerProfile.count).mockResolvedValue(5);
      vi.mocked(prisma.workerProfile.findMany).mockResolvedValue([] as never);

      await workerService.getWorkers({ page: 1, limit: 10 }, "cat-1");

      const expectedWhere = {
        services: {
          some: { categoryId: "cat-1" },
        },
      };

      expect(prisma.workerProfile.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(prisma.workerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
    });
  });

  describe("getWorkerById", () => {
    it("should return worker if found", async () => {
      const mockWorker = { id: "worker-1", user: { name: "Alice" } };
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue(
        mockWorker as never,
      );

      const result = await workerService.getWorkerById("worker-1");

      expect(prisma.workerProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "worker-1" } }),
      );
      expect(result).toEqual(mockWorker);
    });

    it("should throw NotFoundError if worker not found", async () => {
      vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue(null);

      await expect(workerService.getWorkerById("worker-1")).rejects.toThrow(
        NotFoundError,
      );
      await expect(workerService.getWorkerById("worker-1")).rejects.toThrow(
        "Worker not found",
      );
    });
  });
});
