import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";

import { corsOptions } from "@/config/cors";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "@/middlewares/error.middleware";
import router from "@/routes";
import type { ApiResponse } from "@/types";

export const app: Express = express();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// Security Hardening
app.disable("x-powered-by");

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Logging
app.use(pinoHttp({ logger }));

// CORS Configuration
app.use(cors(corsOptions));

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get(
  "/api/health",
  async (
    _req: Request,
    res: Response<
      ApiResponse<{ status: string; timestamp: string; service: string }>
    >,
  ) => {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        success: true,
        data: {
          status: "UP",
          timestamp: new Date().toISOString(),
          service: "ServiceHub Backend API",
        },
      });
    } catch {
      res.status(503).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Database connection failed",
        },
      });
    }
  },
);

// API v1 Routes
app.use("/api/v1", router);

// 404 Handler
app.use((_req: Request, res: Response<ApiResponse<never>>) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Resource not found",
    },
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
