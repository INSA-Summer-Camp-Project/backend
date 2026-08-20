import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createApplication,
  getJobApplications,
  getWorkerApplications,
  rejectApplication,
  withdrawApplication,
} from "@/controllers/application.controller";
import type { CreateApplicationDto } from "@/dtos/application.dto";
import * as applicationService from "@/services/application.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/application.service", () => ({
  createApplication: vi.fn(),
  getWorkerApplications: vi.fn(),
  withdrawApplication: vi.fn(),
  getJobApplications: vi.fn(),
  rejectApplication: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Application Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: "user-1" } as never,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("createApplication", () => {
    it("should create application and send success response", async () => {
      const dto = { jobId: "job-1", proposedPrice: 500, estimatedTime: 2 };
      mockReq.body = dto;

      const mockApplication = { id: "app-1", ...dto };
      vi.mocked(applicationService.createApplication).mockResolvedValue(
        mockApplication as never,
      );

      await createApplication(
        mockReq as Request<
          Record<string, string>,
          unknown,
          CreateApplicationDto
        >,
        mockRes as Response,
        mockNext,
      );

      expect(applicationService.createApplication).toHaveBeenCalledWith(
        "user-1",
        dto,
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockApplication, 201);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Test error");
      vi.mocked(applicationService.createApplication).mockRejectedValue(error);

      createApplication(
        mockReq as Request<
          Record<string, string>,
          unknown,
          CreateApplicationDto
        >,
        mockRes as Response,
        mockNext,
      );
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getWorkerApplications", () => {
    it("should fetch applications and send success response", async () => {
      const mockApplications = [{ id: "app-1" }];
      vi.mocked(applicationService.getWorkerApplications).mockResolvedValue(
        mockApplications as never,
      );

      await getWorkerApplications(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(applicationService.getWorkerApplications).toHaveBeenCalledWith(
        "user-1",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockApplications);
    });
  });

  describe("withdrawApplication", () => {
    it("should withdraw application and send success response", async () => {
      mockReq.params = { id: "app-1" };
      const mockResult = { id: "app-1", status: "WITHDRAWN" };
      vi.mocked(applicationService.withdrawApplication).mockResolvedValue(
        mockResult as never,
      );

      await withdrawApplication(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext,
      );

      expect(applicationService.withdrawApplication).toHaveBeenCalledWith(
        "user-1",
        "app-1",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });

  describe("getJobApplications", () => {
    it("should fetch job applications and send success response", async () => {
      mockReq.params = { jobId: "job-1" };
      const mockApplications = [{ id: "app-1" }];
      vi.mocked(applicationService.getJobApplications).mockResolvedValue(
        mockApplications as never,
      );

      await getJobApplications(
        mockReq as Request<{ jobId: string }>,
        mockRes as Response,
        mockNext,
      );

      expect(applicationService.getJobApplications).toHaveBeenCalledWith(
        "user-1",
        "job-1",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockApplications);
    });
  });

  describe("rejectApplication", () => {
    it("should reject application and send success response", async () => {
      mockReq.params = { id: "app-1" };
      const mockResult = { id: "app-1", status: "REJECTED" };
      vi.mocked(applicationService.rejectApplication).mockResolvedValue(
        mockResult as never,
      );

      await rejectApplication(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext,
      );

      expect(applicationService.rejectApplication).toHaveBeenCalledWith(
        "user-1",
        "app-1",
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });
});
