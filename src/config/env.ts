import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  PORT: z.coerce.number().int().positive().default(3000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  FRONTEND_URL: z.string().default("http://localhost:3000"),

  JWT_SECRET: z
    .string()
    .default("super-secret-jwt-access-key-for-servicehub-phase1"),
  JWT_REFRESH_SECRET: z
    .string()
    .default("super-secret-jwt-refresh-key-for-servicehub-phase1"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  TELEGRAM_CLIENT_ID: z.string().min(1, "TELEGRAM_CLIENT_ID is required"),
  TELEGRAM_CLIENT_SECRET: z
    .string()
    .min(1, "TELEGRAM_CLIENT_SECRET is required"),
  TELEGRAM_REDIRECT_URI: z.string().min(1, "TELEGRAM_REDIRECT_URI is required"),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_OIDC_COOKIE_SECRET: z
    .string()
    .min(32, "TELEGRAM_OIDC_COOKIE_SECRET is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");

  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = result.data;
export type EnvConfig = typeof env;
