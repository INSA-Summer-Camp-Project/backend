import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWorkerById, getWorkers } from "@/controllers/worker.controller";
import * as workerService from "@/services/worker.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/worker.service", () => ({
  getWorkers: vi.fn(),
  getWorkerById: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Worker Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: { page: "1", limit: "10" },
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("getWorkers", () => {
    it("should fetch workers and send success response", async () => {
      const mockResult = {
        data: [{ id: "worker-1" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      vi.mocked(workerService.getWorkers).mockResolvedValue(
        mockResult as never,
      );

      await getWorkers(mockReq as Request, mockRes as Response, mockNext);

      expect(workerService.getWorkers).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        undefined,
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRes,
        mockResult.data,
        200,
        mockResult.meta,
      );
    });

    it("should fetch workers with category filter", async () => {
      mockReq.query = { page: "1", limit: "10", categoryId: "cat-1" };
      const mockResult = {
        data: [{ id: "worker-1" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      vi.mocked(workerService.getWorkers).mockResolvedValue(
        mockResult as never,
      );

      await getWorkers(mockReq as Request, mockRes as Response, mockNext);

      expect(workerService.getWorkers).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        "cat-1",
      );
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Database error");
      vi.mocked(workerService.getWorkers).mockRejectedValue(error);

      await getWorkers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getWorkerById", () => {
    it("should fetch worker by id and send success response", async () => {
      mockReq.params = { id: "worker-1" };
      const mockResult = { id: "worker-1", name: "Alice" };
      vi.mocked(workerService.getWorkerById).mockResolvedValue(
        mockResult as never,
      );

      await getWorkerById(mockReq as Request, mockRes as Response, mockNext);

      expect(workerService.getWorkerById).toHaveBeenCalledWith("worker-1");
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });
});
