import { type CorsOptions } from "cors";
import { env } from "@/config/env";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow the frontend URL
    if (origin === env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    // In development, also allow localhost/127.0.0.1 interchangeably
    if (env.NODE_ENV === "development") {
      if (
        origin === "http://localhost:3000" ||
        origin === "http://127.0.0.1:3000" ||
        origin === "http://localhost:3001" ||
        origin === "http://127.0.0.1:3001"
      ) {
        callback(null, true);
        return;
      }
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};
