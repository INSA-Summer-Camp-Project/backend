import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCertificate,
  addPortfolioItem,
  updateWorkerProfile,
} from "@/controllers/profile.controller";
import * as profileService from "@/services/profile.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/profile.service", () => ({
  updateWorkerProfile: vi.fn(),
  addPortfolioItem: vi.fn(),
  addCertificate: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Profile Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: "user-1" } as never,
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("updateWorkerProfile", () => {
    it("should update profile and send success response", async () => {
      mockReq.body = { bio: "New Bio" };
      const mockResult = { id: "profile-1", bio: "New Bio" };
      vi.mocked(profileService.updateWorkerProfile).mockResolvedValue(
        mockResult as never,
      );

      await updateWorkerProfile(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(profileService.updateWorkerProfile).toHaveBeenCalledWith(
        "user-1",
        { bio: "New Bio" },
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Database error");
      vi.mocked(profileService.updateWorkerProfile).mockRejectedValue(error);

      await updateWorkerProfile(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("addPortfolioItem", () => {
    it("should add portfolio item and send success response", async () => {
      mockReq.body = { title: "Project A", description: "Awesome project" };
      const mockResult = { id: "item-1", title: "Project A" };
      vi.mocked(profileService.addPortfolioItem).mockResolvedValue(
        mockResult as never,
      );

      await addPortfolioItem(mockReq as Request, mockRes as Response, mockNext);

      expect(profileService.addPortfolioItem).toHaveBeenCalledWith("user-1", {
        title: "Project A",
        description: "Awesome project",
      });
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult, 201);
    });
  });

  describe("addCertificate", () => {
    it("should add certificate and send success response", async () => {
      mockReq.body = { name: "Certified Pro", url: "https://cert.com" };
      const mockResult = { id: "cert-1", name: "Certified Pro" };
      vi.mocked(profileService.addCertificate).mockResolvedValue(
        mockResult as never,
      );

      await addCertificate(mockReq as Request, mockRes as Response, mockNext);

      expect(profileService.addCertificate).toHaveBeenCalledWith("user-1", {
        name: "Certified Pro",
        url: "https://cert.com",
      });
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockResult, 201);
    });
  });
});
