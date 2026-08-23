import { type CorsOptions } from "cors";
import { env } from "@/config/env";

const baseAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const configuredOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(",").flatMap((url) => {
      const trimmed = url.trim();
      return [trimmed, trimmed.replace(/\/+$/, "")];
    })
  : [];

const allowedOrigins = new Set([...baseAllowedOrigins, ...configuredOrigins]);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.has(origin) || allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    // In development or test, allow all localhost / 127.0.0.1 origins on any port
    if (env.NODE_ENV !== "production") {
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
        callback(null, true);
        return;
      }
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};
