// Internal module imports using @/* path aliases
import app from "@/app";
import { env } from "@/config/env";

/**
 * Server initialization and listener on configured PORT
 */
const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`,
  );
});

// Shutdown
const shutdown = (signal: string) => {
  console.log(`\n Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log(" HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
