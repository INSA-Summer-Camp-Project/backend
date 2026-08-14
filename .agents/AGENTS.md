# Backend Workspace Rules & Guidelines

## 1. Environment Variable Management (`env` Object)

- **Do NOT** access `process.env` directly throughout the codebase (e.g. avoid `process.env["DATABASE_URL"] ?? ""`).
- **Do NOT** use fallback defaults or inline fallbacks (e.g. `?? ""`) anywhere in the codebase.
- All environment variable reading must go through the central `env` object exported from `src/config/env.ts`.
- Environment variables **MUST** be eagerly loaded and validated at application startup using Zod, failing immediately via `process.exit(1)` if missing or invalid.
- Always import and use `env` (e.g. `env.DATABASE_URL`, `env.PORT`) instead of raw `process.env`.

## 2. Architecture & Layering

- Maintain clean layer separation: **Routes** (`src/routes`) → **Controllers** (`src/controllers`) → **Services** (`src/services`) → **Prisma ORM**.
- Business logic must reside inside service modules, never directly in Express controller handlers.
- Use `@/*` path aliases for all internal module imports.

## 3. API Response & Error Handling

- Use consistent API JSON response structures across all endpoints:
  - Success: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "error": "Error message" }`
- Catch and format all async controller errors through global middleware.
