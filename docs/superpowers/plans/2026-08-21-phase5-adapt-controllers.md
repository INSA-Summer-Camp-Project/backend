# Phase 5: Adapt Controllers to asyncHandler + sendSuccess

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all controllers from manual `try/catch + next(error)` to `asyncHandler` pattern, and ensure all responses use `sendSuccess`.

**Architecture:** 4 controllers already use `asyncHandler` + `sendSuccess`. 5 controllers use manual `try/catch`. 1 controller (telegram) uses try/catch with redirects (leave as-is). Also replace `role.middleware.ts` with `requireActiveRole` from `auth.middleware.ts`.

**Tech Stack:** TypeScript, Express 5, Zod

## Context

The consolidation plan requires unifying all controllers to use:

- `asyncHandler` — wraps async functions, catches errors and forwards to `next()`
- `sendSuccess` — standardized `{ success: true, data, meta? }` response format

Current state:

- **Already done (4):** notification, payment, upload, onboarding
- **Need asyncHandler only (5):** auth, worker, category, profile, search
- **Need asyncHandler + sendSuccess (3):** job, application, review
- **Special case (1):** telegram (redirects, not JSON — leave as-is)
- **Route fix:** `worker.routes.ts` and `category.routes.ts` still use `requireRole` from `role.middleware.ts` instead of `requireActiveRole` from `auth.middleware.ts`

## Global Constraints

- Do not change service layer logic
- Do not change route paths or HTTP methods
- Do not change middleware order on routes
- All 67 tests must still pass after changes
- `telegram.controller.ts` is excluded (redirect-based, not JSON)

---

### Task 1: Convert auth.controller.ts

**File:** `src/controllers/auth.controller.ts`

- [ ] **Step 1:** Replace manual try/catch with `asyncHandler` wrapping
- [ ] **Step 2:** Keep `sendSuccess` (already imported)
- [ ] **Step 3:** Remove `NextFunction` import (no longer needed)
- [ ] **Step 4:** Remove `ApiResponse` type from `res` generics (asyncHandler handles this)

Expected result: All 4 handlers use `asyncHandler(async (req, res) => { ... })` pattern.

---

### Task 2: Convert job.controller.ts

**File:** `src/controllers/job.controller.ts`

- [ ] **Step 1:** Import `asyncHandler` and `sendSuccess`
- [ ] **Step 2:** Replace all 7 handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Replace all `res.status().json({ success: true, ... })` with `sendSuccess(res, data, statusCode)`
- [ ] **Step 4:** Remove manual `NextFunction` import
- [ ] **Step 5:** Remove unused `prisma` import if no longer needed after refactor

Special cases:

- `getPublicJobs` spreads `result` into response — need to use `sendSuccess(res, result.data, 200, result.meta)` or equivalent
- `getMyJobs` queries `prisma.user` for `lastActiveRole` — keep this logic inside the handler

---

### Task 3: Convert application.controller.ts

**File:** `src/controllers/application.controller.ts`

- [ ] **Step 1:** Import `asyncHandler` and `sendSuccess`
- [ ] **Step 2:** Replace all 6 handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Replace all `res.status().json()` with `sendSuccess`
- [ ] **Step 4:** Remove manual `NextFunction` import

---

### Task 4: Convert worker.controller.ts

**File:** `src/controllers/worker.controller.ts`

- [ ] **Step 1:** Import `asyncHandler`
- [ ] **Step 2:** Replace all 12 handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Keep `sendSuccess` (already imported)
- [ ] **Step 4:** Remove manual `NextFunction` import

---

### Task 5: Convert category.controller.ts

**File:** `src/controllers/category.controller.ts`

- [ ] **Step 1:** Import `asyncHandler`
- [ ] **Step 2:** Replace both handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Keep `sendSuccess` (already imported)
- [ ] **Step 4:** Remove manual `NextFunction` import

---

### Task 6: Convert review.controller.ts

**File:** `src/controllers/review.controller.ts`

- [ ] **Step 1:** Import `asyncHandler` and `sendSuccess`
- [ ] **Step 2:** Replace all 6 handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Replace all `res.status().json()` with `sendSuccess`
- [ ] **Step 4:** Remove manual `NextFunction` import
- [ ] **Step 5:** Remove `prisma` import if no longer needed (review service handles role lookup)

Note: `createReview` and `getMyReviews` query `prisma.user` for `lastActiveRole` — these can stay in the controller or be moved to the service. Keep in controller for now to minimize service changes.

---

### Task 7: Convert profile.controller.ts

**File:** `src/controllers/profile.controller.ts`

- [ ] **Step 1:** Import `asyncHandler`
- [ ] **Step 2:** Replace all 3 handlers with `asyncHandler` wrapping
- [ ] **Step 3:** Keep `sendSuccess` (already imported)
- [ ] **Step 4:** Remove manual `NextFunction` import

---

### Task 8: Convert search.controller.ts

**File:** `src/controllers/search.controller.ts`

- [ ] **Step 1:** Import `asyncHandler`
- [ ] **Step 2:** Replace handler with `asyncHandler` wrapping
- [ ] **Step 3:** Keep `sendSuccess` (already imported)
- [ ] **Step 4:** Remove manual `NextFunction` import

---

### Task 9: Replace role.middleware.ts with requireActiveRole

**Files:**

- Modify: `src/routes/worker.routes.ts`
- Modify: `src/routes/category.routes.ts`
- Delete: `src/middlewares/role.middleware.ts`

- [ ] **Step 1:** In `worker.routes.ts`, replace `import { requireRole } from "@/middlewares/role.middleware"` with `import { requireActiveRole } from "@/middlewares/auth.middleware"`
- [ ] **Step 2:** In `worker.routes.ts`, replace `requireRole(["WORKER"])` with `requireActiveRole("WORKER")`
- [ ] **Step 3:** In `category.routes.ts`, replace `import { requireRole } from "@/middlewares/role.middleware"` with `import { requireActiveRole } from "@/middlewares/auth.middleware"`
- [ ] **Step 4:** In `category.routes.ts`, replace `requireRole(["ADMIN"])` with `requireActiveRole("ADMIN")`
- [ ] **Step 5:** Delete `src/middlewares/role.middleware.ts`
- [ ] **Step 6:** Check no other files import `role.middleware` — if none, proceed

---

### Task 10: Run full verification

- [ ] **Step 1:** TypeScript check: `pnpm exec tsc --noEmit` → 0 errors
- [ ] **Step 2:** Tests: `pnpm test` → 67/67 pass
- [ ] **Step 3:** Lint: `pnpm lint` → 0 errors
- [ ] **Step 4:** Format: `pnpm format` → clean

---

### Task 11: Commit

- [ ] **Step 1:** `git add .`
- [ ] **Step 2:** `git commit -m "refactor: adapt all controllers to asyncHandler + sendSuccess pattern"`

---

## Verification Checklist

After all tasks:

1. All controllers use `asyncHandler` (no manual try/catch + next(error))
2. All JSON responses use `sendSuccess`
3. `role.middleware.ts` deleted
4. `worker.routes.ts` and `category.routes.ts` use `requireActiveRole`
5. `telegram.controller.ts` unchanged (redirect-based)
6. TypeScript: 0 errors
7. Tests: 67/67 pass
8. Lint: 0 errors
