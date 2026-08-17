import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

import { corsOptions } from "@/config/cors";
import { errorHandler } from "@/middlewares/error.middleware";
import router from "@/routes";
import type { ApiResponse } from "@/types";

export const app: Express = express();

// Security Hardening
app.disable("x-powered-by");

// CORS Configuration
app.use(cors(corsOptions));

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get(
  "/api/health",
  (
    _req: Request,
    res: Response<
      ApiResponse<{ status: string; timestamp: string; service: string }>
    >,
  ) => {
    res.status(200).json({
      success: true,
      data: {
        status: "UP",
        timestamp: new Date().toISOString(),
        service: "ServiceHub Backend API",
      },
    });
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
