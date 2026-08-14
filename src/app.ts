import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import type { ApiResponse } from "@/types";

export const app: Express = express();

// Security Hardening
app.disable("x-powered-by");

// CORS Configuration
const allowedOrigins = "*";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

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
app.use(
  (
    err: Error,
    _req: Request,
    res: Response<ApiResponse<never>>,
    _next: NextFunction,
  ) => {
    console.error("❌ Express Unhandled Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  },
);

export default app;
