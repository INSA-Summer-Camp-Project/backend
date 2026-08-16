import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import type { ApiResponse } from "@/types";
import router from "@/routes";
import { errorHandler } from "@/middlewares/error.middleware";
import { corsOptions } from "@/config/cors";

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

// Helper exports preserved for existing tests
export const getAppName = () => "ServiceHub Backend API";
export const addNumbers = (a: number, b: number): number => a + b;

// 404 Handler
app.use((_req: Request, res: Response<ApiResponse<never>>) => {
  res.status(404).json({
    success: false,
    error: "Resource not found",
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
