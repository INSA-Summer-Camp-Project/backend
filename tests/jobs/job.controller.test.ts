import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicJobs } from "@/controllers/job.controller";
import * as jobService from "@/services/job.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/job.service", () => ({
  getPublicJobs: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Job Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: { page: "1", limit: "10" } as Record<string, string>,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("getPublicJobs", () => {
    it("should fetch public jobs and send success response", async () => {
      const mockResult = {
        data: [{ id: "job-1", title: "Test Job" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      // The mocked service resolves to our mock result properly casted to unknown first if needed,
      // but getPublicJobs returns a specific type. Let's just mockResolvedValue without any.
      vi.mocked(jobService.getPublicJobs).mockResolvedValue(
        mockResult as unknown as ReturnType<
          typeof jobService.getPublicJobs
        > extends Promise<infer U>
          ? U
          : never,
      );

      getPublicJobs(mockReq as Request, mockRes as Response, mockNext);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(jobService.getPublicJobs).toHaveBeenCalledWith(
        { page: "1", limit: "10" },
        undefined,
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRes,
        mockResult.data,
        200,
        mockResult.meta,
      );
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Database error");
      vi.mocked(jobService.getPublicJobs).mockRejectedValue(error);

      getPublicJobs(mockReq as Request, mockRes as Response, mockNext);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
});
