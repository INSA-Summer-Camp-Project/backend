import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAllCategories } from "@/controllers/category.controller";
import * as categoryService from "@/services/category.service";
import { sendSuccess } from "@/utils/response.util";

// Mock the service
vi.mock("@/services/category.service", () => ({
  getAllCategories: vi.fn(),
}));

// Mock response utility
vi.mock("@/utils/response.util", () => ({
  sendSuccess: vi.fn(),
}));

describe("Category Controller", () => {
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

  describe("getAllCategories", () => {
    it("should fetch all categories and send success response", async () => {
      const mockCategories = [{ id: "cat-1", name: "Plumbing" }];
      vi.mocked(categoryService.getAllCategories).mockResolvedValue(
        mockCategories as never,
      );

      await getAllCategories(mockReq as Request, mockRes as Response, mockNext);

      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(mockRes, mockCategories);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Database error");
      vi.mocked(categoryService.getAllCategories).mockRejectedValue(error);

      await getAllCategories(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
