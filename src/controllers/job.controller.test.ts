import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicJobs } from "@/controllers/job.controller";
import type { PaginationDto } from "@/dtos/common.dto";
import * as jobService from "@/services/job.service";

// Mock the service
vi.mock("@/services/job.service", () => ({
  getPublicJobs: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

import { sendSuccess } from "@/utils/response.util";

describe("Job Controller", () => {
  let mockReq: Partial<
    Request<Record<string, string>, unknown, unknown, PaginationDto>
  >;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: { page: 1, limit: 10 },
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(jobService.getPublicJobs).mockResolvedValue(mockResult as any);

      await getPublicJobs(
        mockReq as Request<
          Record<string, string>,
          unknown,
          unknown,
          PaginationDto
        >,
        mockRes as Response,
        mockNext,
      );

      expect(jobService.getPublicJobs).toHaveBeenCalledWith(
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

    it("should call next with error if service throws", async () => {
      const error = new Error("Database error");
      vi.mocked(jobService.getPublicJobs).mockRejectedValue(error);

      await getPublicJobs(
        mockReq as Request<
          Record<string, string>,
          unknown,
          unknown,
          PaginationDto
        >,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
});
