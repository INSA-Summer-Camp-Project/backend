import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUploadSignature } from "@/controllers/upload.controller";
import * as uploadService from "@/services/upload.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/upload.service", () => ({
  generateUploadSignature: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Upload Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("getUploadSignature", () => {
    it("should generate signature and send success response", () => {
      const mockResult = {
        signature: "sig123",
        timestamp: 123456789,
        cloudName: "cloud",
        apiKey: "key",
      };
      vi.mocked(uploadService.generateUploadSignature).mockReturnValue(
        mockResult,
      );

      getUploadSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(uploadService.generateUploadSignature).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });

    it("should call next with error if service throws", () => {
      const error = new Error("Config error");
      vi.mocked(uploadService.generateUploadSignature).mockImplementation(
        () => {
          throw error;
        },
      );

      getUploadSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
