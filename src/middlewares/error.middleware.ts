import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SELF_ACTION_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;

  constructor(message: string, code: ErrorCode, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", code: ErrorCode = "VALIDATION_ERROR") {
    super(message, code, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code: ErrorCode = "FORBIDDEN") {
    super(message, code, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, "CONFLICT", 409);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (path) fields[path] = issue.message;
    });

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      },
    });
    return;
  }

  console.error("❌ Express Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "Internal server error",
    },
  });
};
