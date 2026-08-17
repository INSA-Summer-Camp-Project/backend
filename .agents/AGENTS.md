# Backend Workspace Rules & Guidelines

## 1. Environment Variable Management (`env` Object)

- **Do NOT** access `process.env` directly throughout the codebase (e.g. avoid `process.env["DATABASE_URL"] ?? ""`).
- **Do NOT** use fallback defaults or inline fallbacks (e.g. `?? ""`) anywhere in the codebase.
- All environment variable reading must go through the central `env` object exported from `src/config/env.ts`.
- Environment variables **MUST** be eagerly loaded and validated at application startup using Zod, failing immediately via `process.exit(1)` if missing or invalid.
- Always import and use `env` (e.g. `env.DATABASE_URL`, `env.PORT`) instead of raw `process.env`.

## 2. Architecture & Modularization Guidelines

**Core Principle:** High cohesion within a module, low coupling between modules.

- This is an **Express + TypeScript** application, NOT NestJS. Do not introduce NestJS concepts (decorators, dependency injection, forced classes, empty repositories).
- Group code that has a strong conceptual relationship. Do not blindly turn every tiny function into its own file.
- Do not perform large architectural rewrites unless necessary. Refactor incrementally, preserving existing behavior and tests.
- Before introducing a new abstraction or directory, explain why the existing structure is insufficient. Prefer the smallest structural change.

### Structural Layout

Prefer a feature-oriented structure for major business domains under `src/modules/` (e.g., `modules/jobs/job.controller.ts`, `job.service.ts`, `job.routes.ts`, `job.schema.ts`).

- Shared/Core infrastructure belongs in `src/lib/` (e.g., `lib/prisma.ts`, `lib/auth/extract-token.ts`, external service wrappers like `lib/chapa/`).
- Centralize error handling in `src/middlewares/error.middleware.ts`.

### Layer Responsibilities

- **Routes:** Define the HTTP API structure and middleware chain. No business logic.
- **Controllers:** Handle HTTP layer (receive `req`, read validated data, call service, return response). Keep them thin. No business logic.
- **Services:** Contain business logic and use-case orchestration.
- **Prisma:** Use Prisma directly from the service layer. **Do NOT create Repositories** unless there is a genuine architectural reason.
- **Validation & DTOs:**
  - Controllers MUST NOT call `zod.parse()` or `.parseAsync()` inline.
  - All validation MUST occur at the route level using the `validate` middleware.
  - Controllers should assume the data in `req.body`, `req.query`, and `req.params` is already validated.

### Middleware Organization

Middleware should be organized by actual responsibility, not grouped into giant files:

- **Authentication (`auth.middleware.ts`):** "Who is this user?" (Extracts token, verifies JWT, attaches `req.user`). Should not query the database unnecessarily.
- **Authorization (`authorization.middleware.ts`):** "Is this authenticated user allowed to do this?" (e.g., System Role checks).
- **Active Role (`active-role.middleware.ts`):** "What role is the user currently operating as?" (Database-backed check).

### General Best Practices

- **Avoid God Files:** Never let files like `auth.ts`, `user.ts`, or `utils.ts` grow to contain routes, controllers, and logic combined.
- **Explicit Naming:** Avoid vague names like `utils.ts`, `helpers.ts`, `misc.ts`. Use clear, descriptive names.
- **Types:** Scope feature-specific types inside their modules (`modules/jobs/job.types.ts`). Global types go in `src/types/`.

## 3. API Response & Error Handling

- Use consistent API JSON response structures across all endpoints:
  - Success: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "error": "Error message" }`
- Catch and format all async controller errors through global middleware.

## 4. Git & Branch Management (Backup Project)

- **The `backup/mvp-reference` Branch**: Treat `backup/mvp-reference` as the `main` branch for the backup project. **Do NOT** commit feature work directly to it.
- **Branch Naming Strategy**: All feature, fix, or docs branches meant for the backup project must branch off from `backup/mvp-reference` and use the `backup/` prefix followed by the standard type (e.g., `backup/feat/*`, `backup/fix/*`, `backup/docs/*`).
- **Best Practices**: Ensure clean, atomic commits and standard Git workflows when working on these backup branches, keeping them strictly isolated from the shared team branches.

## 5. Strict TypeScript Compliance

- **No `any` Types:** Do not use `as any` or the `any` type under any circumstances.
- **No ESLint Suppressions for Types:** Do not use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` to silence type errors.
- **Express Request Mocking:** When mocking Express `Request` objects in tests, do NOT cast with `as unknown as any`. Instead, use the precise Express generics to type the request object properly.
  - _Example:_ `let mockReq: Partial<Request<Record<string, string>, unknown, unknown, PaginationDto>>;`
- **Middleware Typing:** Do not use deprecated types (e.g. `ZodSchema`). Use `ZodTypeAny` when dealing with dynamic generic Zod schemas.
