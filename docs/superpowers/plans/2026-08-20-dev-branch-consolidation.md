# ServiceHub Dev Branch Consolidation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate two diverged ServiceHub backend branches into one coherent architecture, keeping `dev` as the authoritative base and selectively porting valuable features from the backup branch.

**Architecture:** The `dev` branch contains the complete domain model with 7 job states, bidirectional reviews, Service model, password auth, and richer features. The backup branch has a simpler 4-state job model, Chapa/Cloudinary integration, onboarding, and cleaner architecture. The strategy is to keep `dev` as the foundation and port the backup's working integrations (Chapa, Cloudinary, notifications, onboarding) while adopting `dev`'s richer domain model where it adds real value.

**Tech Stack:** Node.js, Express 5, TypeScript, PostgreSQL, Prisma 7, Zod, Chapa, Cloudinary, Telegram OIDC, Vitest

---

## Global Constraints

- `dev` branch is the authoritative base — do NOT merge backup wholesale
- Preserve existing working functionality on `dev`
- One authentication model (Telegram OIDC only — no password/email/phone)
- One error handling model (AppError + errorHandler middleware)
- One authorization model (authenticate + requireRole + requireActiveRole)
- Controllers must be thin (asyncHandler pattern)
- Services contain business logic
- DTOs validate at HTTP boundary (Zod)
- Prisma migrations must be safely migratable from existing dev state
- Do NOT introduce NestJS architecture
- Do NOT create architectural hybrids

---

## Architecture Decision Matrix

| Component           | Decision                                                          | Rationale                                                                     |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Base branch**     | `dev`                                                             | Authoritative foundation per spec                                             |
| **Job states**      | Keep dev's 7 states                                               | More complete lifecycle (OPEN → PENDING → ACCEPTED → IN_PROGRESS → COMPLETED) |
| **Job source**      | Keep dev's POSTING/DIRECT                                         | Matches product requirements                                                  |
| **Reviews**         | Keep dev's bidirectional (CUSTOMER_TO_WORKER, WORKER_TO_CUSTOMER) | Future-proof, already implemented                                             |
| **User model**      | Keep dev's User (with email, phone, passwordHash fields)          | More complete, even if unused for now                                         |
| **Worker model**    | Keep dev's Worker (not WorkerProfile)                             | Dev is the base                                                               |
| **Category model**  | Keep dev's Category + Service                                     | More expressive for marketplace                                               |
| **Payment**         | Port from backup (Chapa integration)                              | Dev removed Chapa, backup has working integration                             |
| **Cloudinary**      | Port from backup                                                  | Dev removed Cloudinary, backup has working integration                        |
| **Notifications**   | Port from backup                                                  | Dev removed notifications, backup has working system                          |
| **Onboarding**      | Port from backup                                                  | Dev doesn't have onboarding flow                                              |
| **Admin**           | Keep dev's admin                                                  | More complete                                                                 |
| **Search**          | Keep dev's search                                                 | Already implemented                                                           |
| **Error handling**  | Keep backup's AppError + errorHandler                             | Cleaner separation                                                            |
| **Auth middleware** | Keep backup's authenticate + requireActiveRole + authorize        | Better separation of concerns                                                 |
| **AsyncHandler**    | Keep backup's asyncHandler                                        | Cleaner controller pattern                                                    |

---

## File Structure

### Files to KEEP from dev (authoritative)

```
prisma/schema.prisma                    # Domain model source of truth
src/controllers/*.ts                    # All controllers
src/services/*.ts                       # All services (will be modified)
src/routes/*.ts                         # All routes (will be modified)
src/middlewares/*.ts                     # Will be replaced with backup's
src/dtos/*.ts                           # Will be replaced with backup's
src/errors/*.ts                         # Will be replaced with backup's
src/lib/*.ts                            # Infrastructure integrations
src/queries/*.ts                        # Will be added from backup
src/utils/*.ts                          # Will be added from backup
tests/**/*.test.ts                      # All tests (will be updated)
```

### Files to PORT from backup

```
src/errors/app-error.ts                 # Backup's error classes
src/errors/index.ts                     # Backup's error exports
src/utils/async-handler.ts              # Backup's asyncHandler
src/utils/response.util.ts              # Backup's sendSuccess
src/middlewares/auth.middleware.ts       # Backup's authenticate + optionalAuth
src/middlewares/active-role.middleware.ts # Backup's requireActiveRole
src/middlewares/authorization.middleware.ts # Backup's authorize
src/middlewares/validate.middleware.ts   # Backup's validate
src/queries/user.queries.ts             # Backup's userSelect
src/types/chapa.ts                      # Backup's Chapa types
src/lib/chapa/chapa.client.ts           # Backup's Chapa gateway
src/services/payment.service.ts         # Backup's payment checkout
src/services/payment-webhook.service.ts # Backup's webhook handler
src/services/upload.service.ts          # Backup's Cloudinary integration
src/services/notification.service.ts    # Backup's notification system
src/services/onboarding.service.ts      # Backup's onboarding
src/controllers/onboarding.controller.ts # Backup's onboarding controller
src/routes/onboarding.routes.ts         # Backup's onboarding routes
```

### Files to CREATE (new features from dev)

```
src/services/direct-hire.service.ts     # Direct hire from dev
src/controllers/direct-hire.controller.ts # Direct hire controller
src/routes/direct-hire.routes.ts        # Direct hire routes
src/dtos/direct-hire.dto.ts             # Direct hire DTOs
```

---

## Phase 0: Architecture Audit (NO CODE CHANGES)

- [ ] **Step 1: Document dev branch architecture**

Create `docs/superpowers/specs/dev-architecture-audit.md` containing:

- Prisma schema analysis (all models, enums, relations)
- Route structure (all endpoints)
- Service boundaries (all exported functions)
- Middleware stack
- Error handling model
- Test structure

- [ ] **Step 2: Document backup branch architecture**

Create `docs/superpowers/specs/backup-architecture-audit.md` with same structure.

- [ ] **Step 3: Create decision matrix**

Create `docs/superpowers/specs/consolidation-decisions.md` with:

- Every difference classified as: KEEP DEV / PORT FROM BACKUP / REIMPLEMENT / REJECT
- Rationale for each decision
- Migration risks identified

---

## Phase 1: Stabilize dev Branch

- [ ] **Step 1: Checkout dev branch**

```bash
git checkout dev
git pull origin dev
```

- [ ] **Step 2: Run baseline checks**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

Document all existing failures.

- [ ] **Step 3: Fix critical TypeScript errors**

Fix any blocking TypeScript errors that prevent compilation.

- [ ] **Step 4: Fix critical test failures**

Fix any test failures that indicate broken business logic.

- [ ] **Step 5: Commit stabilization**

```bash
git add .
git commit -m "chore: stabilize dev branch baseline"
```

---

## Phase 2: Port Error Handling & Middleware from Backup

- [ ] **Step 1: Replace error classes**

Copy from backup:

- `src/errors/app-error.ts`
- `src/errors/index.ts`

Delete dev's error handling from `src/middlewares/error.middleware.ts`.

- [ ] **Step 2: Add errorHandler middleware**

Update `src/middlewares/error.middleware.ts` to export only `errorHandler` function.

- [ ] **Step 3: Add asyncHandler utility**

Create `src/utils/async-handler.ts` from backup.

- [ ] **Step 4: Add response utility**

Create `src/utils/response.util.ts` from backup.

- [ ] **Step 5: Replace auth middleware**

Replace dev's `src/middlewares/auth.middleware.ts` with backup's version (authenticate + optionalAuth).

- [ ] **Step 6: Add active-role middleware**

Create `src/middlewares/active-role.middleware.ts` from backup.

- [ ] **Step 7: Add authorization middleware**

Create `src/middlewares/authorization.middleware.ts` from backup.

- [ ] **Step 8: Replace validate middleware**

Replace dev's `src/middlewares/validate.middleware.ts` with backup's version.

- [ ] **Step 9: Remove dev's role middleware**

Delete `src/middlewares/role.middleware.ts`.

- [ ] **Step 10: Add user queries**

Create `src/queries/user.queries.ts` from backup.

- [ ] **Step 11: Update app.ts middleware stack**

Update `src/app.ts` to use new middleware顺序:

1. CORS
2. Rate limiting
3. Body parsing
4. Request logging
5. Routes
6. 404 handler
7. Error handler

- [ ] **Step 12: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 13: Commit middleware unification**

```bash
git add .
git commit -m "refactor: unify error handling and middleware from backup"
```

---

## Phase 3: Port Infrastructure Integrations from Backup

- [ ] **Step 1: Add Chapa types**

Create `src/types/chapa.ts` from backup.

- [ ] **Step 2: Add Chapa client**

Create `src/lib/chapa/chapa.client.ts` from backup.

- [ ] **Step 3: Add payment DTOs**

Update `src/dtos/payment.dto.ts` from backup.

- [ ] **Step 4: Add payment service**

Create `src/services/payment.service.ts` from backup.

- [ ] **Step 5: Add payment webhook service**

Create `src/services/payment-webhook.service.ts` from backup.

- [ ] **Step 6: Add payment controller**

Create `src/controllers/payment.controller.ts` from backup.

- [ ] **Step 7: Add payment routes**

Create `src/routes/payment.routes.ts` from backup.

- [ ] **Step 8: Register payment routes**

Update `src/routes/index.ts` to include payment router.

- [ ] **Step 9: Add upload service**

Create `src/services/upload.service.ts` from backup.

- [ ] **Step 10: Add upload controller**

Create `src/controllers/upload.controller.ts` from backup.

- [ ] **Step 11: Add upload routes**

Create `src/routes/upload.routes.ts` from backup.

- [ ] **Step 12: Register upload routes**

Update `src/routes/index.ts` to include upload router.

- [ ] **Step 13: Add notification service**

Create `src/services/notification.service.ts` from backup.

- [ ] **Step 14: Add notification DTOs**

Create `src/dtos/notification.dto.ts` from backup.

- [ ] **Step 15: Add notification controller**

Create `src/controllers/notification.controller.ts` from backup.

- [ ] **Step 16: Add notification routes**

Create `src/routes/notification.routes.ts` from backup.

- [ ] **Step 17: Register notification routes**

Update `src/routes/index.ts` to include notification router.

- [ ] **Step 18: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 19: Commit infrastructure integrations**

```bash
git add .
git commit -m "feat: port Chapa, Cloudinary, and notifications from backup"
```

---

## Phase 4: Port Onboarding from Backup

- [ ] **Step 1: Add onboarding DTOs**

Create `src/dtos/onboarding.dto.ts` from backup.

- [ ] **Step 2: Add onboarding service**

Create `src/services/onboarding.service.ts` from backup.

- [ ] **Step 3: Add onboarding controller**

Create `src/controllers/onboarding.controller.ts` from backup.

- [ ] **Step 4: Add onboarding routes**

Create `src/routes/onboarding.routes.ts` from backup.

- [ ] **Step 5: Register onboarding routes**

Update `src/routes/index.ts` to include onboarding router.

- [ ] **Step 6: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 7: Commit onboarding**

```bash
git add .
git commit -m "feat: port onboarding flow from backup"
```

---

## Phase 5: Adapt Dev Services to New Middleware

- [ ] **Step 1: Update auth service**

Adapt `src/services/auth.service.ts` to work with new middleware pattern.

- [ ] **Step 2: Update auth controller**

Adapt `src/controllers/auth.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 3: Update auth routes**

Adapt `src/routes/auth.routes.ts` to use new middleware.

- [ ] **Step 4: Update job service**

Adapt `src/services/job.service.ts` to work with new error classes.

- [ ] **Step 5: Update job controller**

Adapt `src/controllers/job.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 6: Update job routes**

Adapt `src/routes/job.routes.ts` to use new middleware.

- [ ] **Step 7: Update application service**

Adapt `src/services/application.service.ts` to work with new error classes.

- [ ] **Step 8: Update application controller**

Adapt `src/controllers/application.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 9: Update application routes**

Adapt `src/routes/application.routes.ts` to use new middleware.

- [ ] **Step 10: Update worker service**

Adapt `src/services/worker.service.ts` to work with new error classes.

- [ ] **Step 11: Update worker controller**

Adapt `src/controllers/worker.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 12: Update worker routes**

Adapt `src/routes/worker.routes.ts` to use new middleware.

- [ ] **Step 13: Update category service**

Adapt `src/services/category.service.ts` to work with new error classes.

- [ ] **Step 14: Update category controller**

Adapt `src/controllers/category.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 15: Update review service**

Adapt `src/services/review.service.ts` to work with new error classes.

- [ ] **Step 16: Update review controller**

Adapt `src/controllers/review.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 17: Update profile service**

Adapt `src/services/profile.service.ts` to work with new error classes.

- [ ] **Step 18: Update profile controller**

Adapt `src/controllers/profile.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 19: Update admin service**

Adapt `src/services/admin.service.ts` to work with new error classes.

- [ ] **Step 20: Update admin controller**

Adapt `src/controllers/admin.controller.ts` to use asyncHandler + sendSuccess.

- [ ] **Step 21: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 22: Commit service adaptation**

```bash
git add .
git commit -m "refactor: adapt all dev services to new middleware pattern"
```

---

## Phase 6: Port Direct Hire from Dev

- [ ] **Step 1: Add direct-hire DTOs**

Create `src/dtos/direct-hire.dto.ts` with:

- `CreateDirectHireDto` (targetWorkerId, categoryId, title, description, budget)
- `RespondToDirectHireDto` (action: "accept" | "decline")

- [ ] **Step 2: Add direct-hire service**

Create `src/services/direct-hire.service.ts` with:

- `createDirectHire(customerId, dto)` — creates job with DIRECT source and targetWorkerId
- `respondToDirectHire(workerId, jobId, action)` — worker accepts/declines

- [ ] **Step 3: Add direct-hire controller**

Create `src/controllers/direct-hire.controller.ts` with:

- `createDirectHire` handler
- `respondToDirectHire` handler

- [ ] **Step 4: Add direct-hire routes**

Create `src/routes/direct-hire.routes.ts`:

```
POST /direct-hire              (CUSTOMER) → createDirectHire
PATCH /direct-hire/:id/respond (WORKER) → respondToDirectHire
```

- [ ] **Step 5: Register direct-hire routes**

Update `src/routes/index.ts` to include direct-hire router.

- [ ] **Step 6: Add tests**

Create `tests/direct-hire/direct-hire.service.test.ts` with:

- Customer creates direct hire
- Worker accepts
- Worker declines
- Unauthorized user cannot respond

- [ ] **Step 7: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 8: Commit direct hire**

```bash
git add .
git commit -m "feat: implement direct hire functionality"
```

---

## Phase 7: Enhance Worker Profile from Dev

- [ ] **Step 1: Add worker self-service endpoints**

Update `src/services/worker.service.ts` to add:

- `getMyProfile(userId)` — worker views own profile
- `updateMyProfile(userId, dto)` — worker updates own profile

- [ ] **Step 2: Add worker service management**

Update `src/services/worker.service.ts` to add:

- `getMyServices(userId)` — list worker's services
- `createService(userId, dto)` — add service to worker
- `updateService(userId, serviceId, dto)` — update service
- `deleteService(userId, serviceId)` — remove service

- [ ] **Step 3: Add portfolio management**

Update `src/services/worker.service.ts` to add:

- `createPortfolio(userId, dto)` — add portfolio item
- `deletePortfolio(userId, portfolioId)` — remove portfolio item

- [ ] **Step 4: Add certificate management**

Update `src/services/worker.service.ts` to add:

- `createCertificate(userId, dto)` — add certificate
- `deleteCertificate(userId, certificateId)` — remove certificate

- [ ] **Step 5: Add worker routes**

Update `src/routes/worker.routes.ts`:

```
GET  /workers/me              (WORKER) → getMyProfile
PUT  /workers/me              (WORKER) → updateMyProfile
GET  /workers/me/services     (WORKER) → getMyServices
POST /workers/me/services     (WORKER) → createService
PUT  /workers/me/services/:id (WORKER) → updateService
DELETE /workers/me/services/:id (WORKER) → deleteService
POST /workers/me/portfolios   (WORKER) → createPortfolio
DELETE /workers/me/portfolios/:id (WORKER) → deletePortfolio
POST /workers/me/certificates (WORKER) → createCertificate
DELETE /workers/me/certificates/:id (WORKER) → deleteCertificate
```

- [ ] **Step 6: Add DTOs**

Update `src/dtos/worker.dto.ts` with:

- `UpdateWorkerProfileDto`
- `CreateServiceDto`
- `UpdateServiceDto`
- `CreatePortfolioDto`
- `CreateCertificateDto`

- [ ] **Step 7: Add tests**

Create `tests/workers/worker-profile.test.ts` with:

- Worker gets own profile
- Worker updates profile
- Worker manages services
- Worker manages portfolios
- Worker manages certificates

- [ ] **Step 8: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 9: Commit worker profile enhancements**

```bash
git add .
git commit -m "feat: enhance worker profile with self-service endpoints"
```

---

## Phase 8: Enhance Reviews from Dev

- [ ] **Step 1: Add review management**

Update `src/services/review.service.ts` to add:

- `updateReview(userId, reviewId, dto)` — update review
- `deleteReview(userId, reviewId)` — delete review
- `getWorkerReviews(workerId, query)` — get reviews for worker
- `getCustomerReviews(customerId, query)` — get reviews by customer
- `getMyReviews(userId, query)` — get current user's reviews

- [ ] **Step 2: Add review routes**

Update `src/routes/review.routes.ts`:

```
GET  /reviews              (public) → getReviews
GET  /reviews/:id          (public) → getReviewById
POST /reviews              (CUSTOMER) → createReview
PUT  /reviews/:id          (CUSTOMER) → updateReview
DELETE /reviews/:id        (CUSTOMER) → deleteReview
GET  /reviews/worker/:id   (public) → getWorkerReviews
GET  /reviews/customer/me  (CUSTOMER) → getCustomerReviews
GET  /reviews/my           (any) → getMyReviews
```

- [ ] **Step 3: Add review DTOs**

Update `src/dtos/review.dto.ts` with:

- `UpdateReviewDto`
- `ReviewQueryDto` (with pagination)

- [ ] **Step 4: Add tests**

Update `tests/reviews/review.service.test.ts` with:

- Customer updates review
- Customer deletes review
- Non-owner cannot update/delete
- Get worker reviews
- Get customer reviews

- [ ] **Step 5: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 6: Commit review enhancements**

```bash
git add .
git commit -m "feat: enhance reviews with update/delete and queries"
```

---

## Phase 9: Enhance Applications from Dev

- [ ] **Step 1: Add application withdrawal**

Update `src/services/application.service.ts` to add:

- `withdrawApplication(workerId, applicationId)` — worker withdraws pending application

- [ ] **Step 2: Add application queries**

Update `src/services/application.service.ts` to add:

- `getMyApplications(workerId, query)` — worker's applications with pagination

- [ ] **Step 3: Add application routes**

Update `src/routes/application.routes.ts`:

```
POST   /applications           (WORKER) → applyToJob
GET    /applications/my        (WORKER) → getMyApplications
DELETE /applications/:id       (WORKER) → withdrawApplication
GET    /applications/job/:jobId (CUSTOMER) → getJobApplications
PATCH  /applications/:id/accept (CUSTOMER) → acceptApplication
PATCH  /applications/:id/reject (CUSTOMER) → rejectApplication
```

- [ ] **Step 4: Add tests**

Update `tests/applications/application.service.test.ts` with:

- Worker withdraws application
- Worker gets own applications
- Pagination works

- [ ] **Step 5: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 6: Commit application enhancements**

```bash
git add .
git commit -m "feat: enhance applications with withdrawal and queries"
```

---

## Phase 10: Enhance Jobs from Dev

- [ ] **Step 1: Add job update**

Update `src/services/job.service.ts` to add:

- `updateJob(userId, jobId, dto)` — customer updates job details (only OPEN jobs)

- [ ] **Step 2: Add terminal state protection**

Update `src/services/job.service.ts` to ensure:

- Cannot update COMPLETED/CANCELLED jobs
- Cannot apply to COMPLETED/CANCELLED jobs
- Cannot accept applications for COMPLETED/CANCELLED jobs

- [ ] **Step 3: Add job routes**

Update `src/routes/job.routes.ts`:

```
GET  /jobs/public           (public) → getPublicJobs
POST /jobs                  (CUSTOMER) → createJob
GET  /jobs/me               (CUSTOMER) → getMyJobs
GET  /jobs/worker/me        (WORKER) → getWorkerJobs
GET  /jobs/:id              (optionalAuth) → getJobById
PUT  /jobs/:id              (CUSTOMER) → updateJob
PATCH /jobs/:id/status      (CUSTOMER) → updateJobStatus
PATCH /jobs/:id/complete    (CUSTOMER) → completeJob
```

- [ ] **Step 4: Add tests**

Update `tests/jobs/job.service.test.ts` with:

- Customer updates OPEN job
- Cannot update COMPLETED job
- Terminal state protection

- [ ] **Step 5: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 6: Commit job enhancements**

```bash
git add .
git commit -m "feat: enhance jobs with update and terminal state protection"
```

---

## Phase 11: Add Admin from Dev

- [ ] **Step 1: Port admin service**

Update `src/services/admin.service.ts` from dev with:

- `getDashboardStats()`
- `getAllUsers(query)`
- `updateUserRole(userId, role)`
- `createCategory(data)`
- `deleteCategory(id)`

- [ ] **Step 2: Port admin controller**

Update `src/controllers/admin.controller.ts` from dev.

- [ ] **Step 3: Port admin routes**

Update `src/routes/admin.routes.ts` from dev.

- [ ] **Step 4: Port admin DTOs**

Update `src/dtos/admin.dto.ts` from dev.

- [ ] **Step 5: Register admin routes**

Update `src/routes/index.ts` to include admin router.

- [ ] **Step 6: Run tests**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 7: Commit admin**

```bash
git add .
git commit -m "feat: port admin functionality from dev"
```

---

## Phase 12: Update All Tests

- [ ] **Step 1: Update auth tests**

Update `tests/auth/*.test.ts` to work with new middleware pattern.

- [ ] **Step 2: Update job tests**

Update `tests/jobs/*.test.ts` to work with new service functions.

- [ ] **Step 3: Update application tests**

Update `tests/applications/*.test.ts` to work with new service functions.

- [ ] **Step 4: Update worker tests**

Update `tests/workers/*.test.ts` to work with new service functions.

- [ ] **Step 5: Update review tests**

Update `tests/reviews/*.test.ts` to work with new service functions.

- [ ] **Step 6: Update profile tests**

Update `tests/profiles/*.test.ts` to work with new service functions.

- [ ] **Step 7: Add payment tests**

Create `tests/payments/payment.service.test.ts` with:

- Checkout requires valid job/application
- Payment starts as pending
- Duplicate webhook is safe
- Invalid Chapa verification rejected

- [ ] **Step 8: Add upload tests**

Create `tests/uploads/upload.service.test.ts` with:

- Signature generation
- User-scoped folder
- Unauthorized deletion rejected
- Owner deletion succeeds

- [ ] **Step 9: Add notification tests**

Create `tests/notifications/notification.service.test.ts` with:

- Get user notifications
- Mark as read
- Mark all as read

- [ ] **Step 10: Add onboarding tests**

Create `tests/onboarding/onboarding.service.test.ts` with:

- Get onboarding status
- Complete onboarding
- Idempotent completion

- [ ] **Step 11: Run full test suite**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
```

- [ ] **Step 12: Commit test updates**

```bash
git add .
git commit -m "test: update all tests for consolidated architecture"
```

---

## Phase 13: Final Verification

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All tests pass

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: 0 errors

- [ ] **Step 4: Run format check**

```bash
pnpm format:check
```

Expected: All files formatted

- [ ] **Step 5: Manual end-to-end verification**

Test the complete flow:

1. Telegram login
2. Onboarding (role selection)
3. Customer creates job
4. Worker searches and applies
5. Customer views applications
6. Customer accepts worker
7. Job becomes ASSIGNED
8. Worker performs service
9. Customer confirms completion
10. Job becomes COMPLETED
11. Payment can be finalized
12. Customer reviews worker

- [ ] **Step 6: Inspect git diff**

```bash
git diff dev..HEAD --stat
```

Check for:

- Accidental deletions
- Unrelated changes
- Schema destruction
- Duplicate modules
- Dead code
- Broken routes

- [ ] **Step 7: Commit final consolidation**

```bash
git add .
git commit -m "consolidate: complete dev branch consolidation with backup features"
```

---

## Final Report Template

After completing all phases, report:

### 1. Architecture Decisions

- What was kept from dev and why
- What was adopted from backup and why
- What was deliberately rejected and why

### 2. Database Changes

- Models changed
- Fields changed
- Relations changed
- Enums changed
- Migrations created

### 3. Features Recovered

- Search
- Direct hire
- Worker management
- Application improvements
- Reviews
- Notifications
- Cloudinary
- Chapa
- Onboarding
- Admin

### 4. Features Preserved

- Telegram authentication
- Job lifecycle
- Application flow
- Payment integration
- Upload system
- Notification system
- Admin functionality

### 5. Business Rules

- Payment does not complete a job
- Customer completion is required
- Worker payment finalization requires COMPLETED
- Review requires COMPLETED

### 6. Files Changed

- List all files created
- List all files modified
- List all files deleted

### 7. Tests

- TypeScript: [result]
- Tests: [result]
- Lint: [result]

### 8. Remaining Issues

- List anything that could not safely be resolved
- List assumptions made
- List domain gaps identified

---

## STOP

After reporting the result:

**STOP.**

Do not start another feature.

Wait for further instructions.
