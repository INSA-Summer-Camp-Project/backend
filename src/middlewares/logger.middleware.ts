import type { Request, Response, NextFunction } from "express";

/**
 * Global HTTP Request Logging Middleware
 * Logs incoming requests and their completion status with response times.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const { method, originalUrl, url } = req;
  const path = originalUrl || url;

  // Log on response completion
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    let indicator = "🟢";
    if (statusCode >= 500) {
      indicator = "🔴";
    } else if (statusCode >= 400) {
      indicator = "🟡";
    }

    console.log(
      `${indicator} [HTTP] ${method} ${path} ${statusCode} (${duration}ms)`,
    );
  });

  next();
};
