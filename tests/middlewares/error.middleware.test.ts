import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z, ZodError } from "zod";

import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/errors";
import { errorHandler } from "@/middlewares/error.middleware";

describe("Error Middleware", () => {
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

    // Suppress console.error in tests to avoid noisy output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("AppError and subclasses", () => {
    const errorCases = [
      {
        ErrorClass: BadRequestError,
        expectedStatus: 400,
        expectedCode: "VALIDATION_ERROR",
      },
      {
        ErrorClass: UnauthorizedError,
        expectedStatus: 401,
        expectedCode: "UNAUTHENTICATED",
      },
      {
        ErrorClass: ForbiddenError,
        expectedStatus: 403,
        expectedCode: "FORBIDDEN",
      },
      {
        ErrorClass: NotFoundError,
        expectedStatus: 404,
        expectedCode: "NOT_FOUND",
      },
      {
        ErrorClass: ConflictError,
        expectedStatus: 409,
        expectedCode: "CONFLICT",
      },
    ];

    it.each(errorCases)(
      "should handle $ErrorClass.name correctly",
      ({ ErrorClass, expectedStatus, expectedCode }) => {
        const error = new ErrorClass("Custom message");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: expectedCode,
            message: "Custom message",
          },
        });
      },
    );

    it("should handle base AppError correctly", () => {
      const error = new AppError("Base error", "INTERNAL_ERROR", 500);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Base error",
        },
      });
    });
  });

  describe("ZodError", () => {
    it("should handle ZodError and map issues to fields", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["body", "email"],
          message: "Expected string, received number",
        },
        {
          code: "too_small",
          minimum: 8,
          type: "string",
          inclusive: true,
          exact: false,
          path: ["body", "password"],
          message: "String must contain at least 8 character(s)",
        },
      ] as unknown as z.ZodIssue[]);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          fields: {
            "body.email": "Expected string, received number",
            "body.password": "String must contain at least 8 character(s)",
          },
        },
      });
    });

    it("should handle ZodError with empty path", () => {
      const zodError = new ZodError([
        {
          code: "custom",
          path: [],
          message: "Root level error",
        },
      ] as unknown as z.ZodIssue[]);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          fields: undefined,
        },
      });
    });
  });

  describe("Unknown errors", () => {
    it("should handle standard Error and return 500", () => {
      const error = new Error("Database connection failed");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith(
        "❌ Express Unhandled Error:",
        error,
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Database connection failed",
        },
      });
    });
  });
});
