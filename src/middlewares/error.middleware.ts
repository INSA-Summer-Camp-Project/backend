import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "@/errors";

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
