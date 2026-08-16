import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/api";

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedMessage = err.issues
      .map((issue) => issue.message)
      .join(", ");
    res.status(400).json({
      success: false,
      error: formattedMessage || "Validation error",
    });
    return;
  }

  console.error("❌ Express Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
};
