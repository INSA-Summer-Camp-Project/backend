# ServiceHub Full-Stack Integration Audit

**Date:** 2026-08-22
**Scope:** `backend/` (Express 5 + Prisma 7) and `web/` (Next.js 16 App Router + React Query + Zustand)
**Not audited in depth:** `mobile/` (React Native), `.github/` workflows

---

## Architecture Overview

| Layer      | Backend                                                    | Web                                                               |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Runtime    | Express 5 (ESM, TSX)                                       | Next.js 16 App Router (React 19, RSC)                             |
| ORM        | Prisma 7 (PostgreSQL via PG adapter)                       | —                                                                 |
| Auth       | Telegram OIDC (PKCE), JWT access+refresh, httpOnly cookies | Zustand authStore, axios withCredentials, middleware route guards |
| Validation | Zod DTOs + `validate()` middleware on every route          | React Hook Form + Zod schemas                                     |
| Payments   | Chapa (Ethiopian) checkout + webhook                       | Checkout page + redirect flow                                     |
| Uploads    | Cloudinary                                                 | Cloudinary upload widget                                          |
| Tests      | Vitest + Supertest (16 test files in `tests/`)             | Vitest + Testing Library (few, mostly config)                     |

### Backend Route Map (`routes/index.ts`)

```
/auth          → telegram login/register, refresh, me, logout, onboard, role switch
/onboarding    → GET/POST onboarding status
/categories    → GET (public), POST (ADMIN)
/profiles      → POST worker/portfolio/certificates (legacy duplicates of /workers/*)
/workers       → profile CRUD, services, portfolios, certificates, public profiles, reviews, reputation
/customers     → profile CRUD, public profiles, reviews
/search        → GET /providers (public, filtered)
/jobs          → CRUD, direct-hire, status updates, applications
/applications  → GET mine, accept/reject, withdraw
/reviews       → CRUD, integrity checks
/payments      → checkout session, webhook (public)
/uploads       → Cloudinary signature, delete
/notifications → customer/* and worker/* variants (list, unread-count, mark-read)
/reports       → submit + my-reports (authenticated)
/admin         → stats, user management, category CRUD, report management
```

---

## Findings

### CRITICAL

#### 1. Web Notifications Fully Broken — 404 on Every Endpoint

**Frontend calls bare paths; backend only exposes role-scoped variants.**

| Frontend call (`web/src/lib/api/notifications.ts`) | Backend actual route (`notification.routes.ts`)           |
| -------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/v1/notifications`                        | `GET /api/v1/notifications/customer` or `/worker`         |
| `GET /api/v1/notifications/unread-count`           | `GET .../customer/unread-count` or `/worker/unread-count` |
| `PATCH /api/v1/notifications/:id/read`             | `PATCH .../customer/:id/read` or `/worker/:id/read`       |
| `PATCH /api/v1/notifications/read-all`             | `PATCH .../customer/read-all` or `/worker/read-all`       |

**Impact:** NotificationBell (`components/features/notifications/NotificationBell.tsx:13`) always empty. Notifications page (`app/(dashboard)/notifications/page.tsx:51`) always errors. Users cannot see any notifications from the web app.

**Files:** `web/src/lib/api/notifications.ts:6-26` vs `backend/src/routes/notification.routes.ts:11-51`

**Fix:** Add bare alias routes that detect active role and delegate, or update the frontend API client to use role-scoped paths based on `authStore.activeRole`.

---

#### 2. Chapa Webhook Misconfigured in Default Dev Environment

**`CHAPA_CALLBACK_URL` is not set in `.env`.**

Fallback logic in `payment.service.ts`:

```ts
callbackUrl: env.CHAPA_CALLBACK_URL ||
  `${env.FRONTEND_URL.replace("localhost", "host.docker.internal")}/api/payments/webhook`;
```

- `FRONTEND_URL` = `http://127.0.0.1:3000`
- `.replace("localhost", ...)` does NOT match `127.0.0.1` → URL stays `http://127.0.0.1:3000/api/payments/webhook`
- Chapa webhook fires to the **Next.js frontend** (port 3000), not the backend (port 8000)
- Backend webhook endpoint (`POST /api/v1/payments/webhook`) never receives the notification

**Impact:** All payments remain `PENDING` forever. No `GET /payments/verify/:txRef` endpoint exists for manual recovery.

**File:** `backend/src/services/payment.service.ts:30-40` (checkout), `backend/src/config/env.ts` (CHAPA_CALLBACK_URL fallback)

---

#### 3. Payment Success Page Orphaned & Escrow Not Enforced

Three compounding issues:

**a) Return URL lands on unhandled path.** `CHAPA_RETURN_URL` not set → defaults to `${FRONTEND_URL}/customer/jobs/${jobId}?payment=success`. The job detail page ignores the `?payment=success` query param entirely.

**b) Dedicated success page exists but is unreachable.** `app/(dashboard)/customer/checkout/[jobId]/success/page.tsx` renders a "Payment Successful!" message but nothing routes to it. Even if reached, it does NOT verify payment with the backend — pure cosmetic.

**c) Escrow is not enforced in business logic.**

- Job can be marked `COMPLETED` without any `PAID` payment record (`job.service.updateJobStatus` only checks job status, not payment status)
- Cancel-after-pay has no refund path (Chapa refund API not integrated)
- UI claims "Escrow Protected" and "Payment Secured in Escrow" (`JobPaymentStatus.tsx:73-80`) but the backend has no escrow state machine

**Files:** `backend/src/services/payment.service.ts:28-35`, `web/src/app/(dashboard)/customer/checkout/[jobId]/success/page.tsx`, `web/src/components/features/jobs/JobPaymentStatus.tsx`

---

### HIGH

#### 4. Worker Direct-Hire Response UI Missing

`DirectRespondPanel` component and `useDirectRespond` hook are fully implemented but **never rendered in any page**.

- Backend sends `DIRECT_HIRE` notifications with `link: "/worker/jobs/${job.id}"`
- Worker navigates to `/worker/jobs/[id]` which shows job info + "Submit Proposal" button only
- No accept/decline UI exists on this page

**Impact:** Workers cannot accept or decline direct bookings from the web UI. The entire direct-hire flow is broken on the worker side.

**Dead code:** `web/src/components/features/worker/DirectRespondPanel.tsx`, `web/src/hooks/useApplications.ts:80-91`

---

#### 5. ReportModal Never Mounted — Moderation Intake Dead on Web

`ReportModal` is fully built (reason selector, description, validation) but **not rendered anywhere** in the app. Grep shows only its own definition — no imports in any page or layout.

**Impact:** No user-facing way to report other users. Backend `POST /reports` is complete and functional.

**Dead code:** `web/src/components/features/reports/ReportModal.tsx`

---

#### 6. `?tab=my_work` Navigation Broken

Three components link to `/worker/jobs?tab=my_work`:

- `WorkerSidebar.tsx:51`
- `WorkerMobileNav.tsx:30`
- `MyApplicationsPreview.tsx:21`

The worker jobs page (`app/(dashboard)/worker/jobs/page.tsx`) never reads `useSearchParams` — it always shows the open job marketplace.

**Impact:** "My Work" sidebar link, mobile nav, and "View All Applications" all navigate to the same page as "Find Jobs".

---

### MEDIUM

#### 7. PATCH /jobs/:id/status Missing Route-Level Role Guard

`routes/job.routes.ts` only uses `authenticate` — no `authorize(["CUSTOMER"])` or `requireActiveRole()`. The service layer checks `job.customer.userId === requesterId || job.assignedWorker?.userId === requesterId`, so authorization works, but it's inconsistent with the rest of the API which uses route-level middleware.

Additionally:

- `UpdateJobStatusDtoSchema` allows `IN_PROGRESS` but the service rejects it with `BadRequestError`
- Frontend `JobStatus` type includes `DISPUTED` which isn't in the DTO or service

**File:** `backend/src/routes/job.routes.ts`, `backend/src/services/job.service.ts:458-477`

---

#### 8. sortBy:"jobs" Silently Unimplemented

Frontend offers "Most Completed Jobs" sort (`CustomerWorkersDiscoveryPage.tsx:153`). Backend `WorkerQueryDtoSchema` accepts `"jobs"` in the enum. But `worker.service.ts:161-175` switch statement has no `case "jobs":` — falls through to the `default:` (rating sort).

**Impact:** Users selecting "Most Completed Jobs" see results sorted by rating instead.

**File:** `backend/src/services/worker.service.ts:161-175`

---

#### 9. Worker Dashboard "Total Earnings" Misleading

`worker/dashboard/page.tsx:66-74` computes earnings as:

```ts
totalEarnings = workerJobs
  .filter((j) => j.status === "COMPLETED")
  .reduce(sum + j.budget);
```

This sums job **budgets**, not actual payment amounts or accepted proposed prices. A job with budget 1000 where the worker bid 800 shows 1000 as "earned".

**File:** `web/src/app/(dashboard)/worker/dashboard/page.tsx:66-74`

---

#### 10. deleteCategory → Raw 500 on In-Use Category

`admin.service.deleteCategory` has no usage check. `Job.categoryId` and `WorkerService.categoryId` both have `onDelete: Restrict`. Deleting a category that has jobs or services throws Prisma P2003 FK violation → unhandled → 500 Internal Server Error instead of a meaningful 409 Conflict.

**File:** `backend/src/services/admin.service.ts:77-80`

---

#### 11. updateUserRole: No Self-Demotion or Last-Admin Guard

Admin can demote themselves to USER or demote the only remaining ADMIN. No guard against:

- `req.user.id === userId` (self-demotion)
- Counting remaining admins before demoting

**File:** `backend/src/services/admin.service.ts:57-65`

---

#### 12. estimatedTime Semantic Mismatch

Backend `CreateApplicationDtoSchema` expects a human string (`"3 days"`, `min 1 char`). Worker job detail page (`worker/jobs/[id]/page.tsx:136`) sends `parseInt(estimatedTime, 10)` — raw minutes as a number. `useCreateProposal` stringifies it (`String(payload.estimatedTime)`) so it passes validation as `"120"`.

Displayed in UI as `Est. 120` (unit-less).

**File:** `web/src/app/(dashboard)/worker/jobs/[id]/page.tsx:136`, `web/src/hooks/useApplications.ts:164`

---

### LOW

#### 13. Search Placeholder Claims Skill Search; Backend Searches Only Bio + Name

`CustomerWorkersDiscoveryPage.tsx:110` placeholder: "Search by specialist name, skill, or keyword..."
Backend `worker.service.ts:129-137` searches `{ bio, user.name }` — NOT worker services/skills.

---

#### 14. "Verified Professional" Badge Shown Unconditionally

`CustomerWorkersDiscoveryPage.tsx:319-323` renders `<ShieldCheck>` for every worker. No `isVerified` field exists on the Worker model.

---

#### 15. SettingsView Telegram Toggle Is Client-Only State

`SettingsView.tsx:126-129` toggles `useState(true)` and toasts "Preferences updated." — no backend call, no persistence.

---

#### 16. Cookie Max-Age Inconsistency

- Onboarding sets `servicehub_active_role` cookie with `max-age=2592000` (30 days) — `onboarding/page.tsx:60`
- Settings role switch sets same cookie with `max-age=31536000` (365 days) — `SettingsView.tsx:27`

---

#### 17. Landing Navbar Ignores Auth State

`Navbar.tsx` always shows "Log In" / "Get Started" regardless of whether the user is authenticated. No `useAuthStore` check.

---

#### 18. status Filter Param Silently Stripped

Worker jobs page sends `status: "OPEN"` to `useJobs`. Backend `JobQueryDtoSchema` does not include `status` — Zod strips unknown keys. Harmless but dead code in the frontend.

---

#### 19. Legacy Duplicate Profile Endpoints

`/api/v1/profiles/worker`, `/profiles/worker/portfolio`, `/profiles/worker/certificates` duplicate the `/api/v1/workers/me/*` endpoints. Both create the same resources.

---

#### 20. Two Parallel Apply Hooks; ApplyForm Unused

- `useApplyJob` (generic) and `useCreateProposal` (wrapper with `String()`) both call `POST /jobs/:jobId/apply`
- `ApplyForm` component exists but is never rendered; worker job detail page has inline modal instead

---

## What's Working Well

| Area                             | Detail                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Layered architecture**         | Consistent routes → controllers → services → Prisma. Clean separation of concerns.                                                       |
| **Zod validation**               | Every route uses `validate()` middleware with typed DTOs.                                                                                |
| **Auth security**                | Telegram OIDC with PKCE, JWT access+refresh rotation, httpOnly cookies, `requireActiveRole` middleware.                                  |
| **Profile-scoped notifications** | Model uses `customerProfileId`/`workerId` with ownership checks.                                                                         |
| **Idempotent webhook**           | Payment upsert on `tx_ref` prevents duplicate processing.                                                                                |
| **Contact reveal gating**        | `GET /jobs/:id/contact` restricted to job participants (customer + assigned worker).                                                     |
| **Review integrity**             | One review per job per role, must be completed job, no self-review, rating 1-5 integer.                                                  |
| **Reputation aggregates**        | `Worker.reviewsReceived.reviews.avg` + rating distribution, trust badges, total jobs computed server-side.                               |
| **Pagination discipline**        | Consistent `{ data, meta: { page, limit, total, totalPages } }` envelope with `pageDefaults`.                                            |
| **Test coverage**                | 16 test files covering auth, onboarding, categories, customer, worker, search, hiring, ratings, payments, notifications, reports, admin. |

---

## Verification Commands

| Project   | Command           | What it runs                                    |
| --------- | ----------------- | ----------------------------------------------- |
| Backend   | `pnpm full-check` | format:check → tsc --noEmit → eslint → vitest   |
| Backend   | `pnpm check`      | format:check → tsc --noEmit → eslint (no tests) |
| Web       | `pnpm check`      | format:check → tsc --noEmit → eslint → vitest   |
| Lint only | `pnpm lint`       | ESLint                                          |

---

## Recommended Fix Priority

| Priority                | Findings                                                                         | Effort   |
| ----------------------- | -------------------------------------------------------------------------------- | -------- |
| **P0 — Ship blockers**  | #1 (notifications 404), #2 (webhook misconfig), #3a-c (payment verification)     | 1-2 days |
| **P1 — Core flow gaps** | #4 (direct-hire respond), #5 (report modal), #6 (my_work tab)                    | 1 day    |
| **P2 — Business logic** | #7 (status guard), #9 (earnings metric), #10 (delete category), #11 (role guard) | 0.5 day  |
| **P3 — Polish**         | #8 (sort fallback), #12 (estimatedTime), #13-20 (low-sev items)                  | 0.5 day  |
