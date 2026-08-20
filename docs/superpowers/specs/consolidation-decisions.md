# Consolidation Decisions Matrix

> Date: 2026-08-20
> Base branch: `dev`
> Reference branch: `backup/feat/mvp-reference`

## Decision Legend

| Decision            | Meaning                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| KEEP DEV            | Dev's version is correct; no change needed                               |
| PORT FROM BACKUP    | Backup has working integration/code that dev removed or lacks; port it   |
| REIMPLEMENT CLEANLY | Neither branch has ideal implementation; build fresh using best patterns |
| REJECT              | Backup feature is not wanted in consolidated codebase                    |
| REQUIRES DECISION   | Needs human judgment before proceeding                                   |

---

## 1. Database Schema

### User Model

| Aspect                            | Dev                                           | Backup                | Decision | Rationale                                     |
| --------------------------------- | --------------------------------------------- | --------------------- | -------- | --------------------------------------------- |
| email, phone, passwordHash fields | Present                                       | Absent                | KEEP DEV | More complete model; fields may be used later |
| Role enum                         | CUSTOMER, WORKER, BUSINESS, ADMIN             | Absent                | KEEP DEV | Matches product requirements                  |
| UserStatus                        | PENDING, ACTIVE, SUSPENDED                    | Absent                | KEEP DEV | Needed for admin functionality                |
| Fields                            | email?, phone?, passwordHash?, role?, status? | Only telegramId, name | KEEP DEV | Dev is more complete                          |

### Customer Model

| Aspect                  | Dev                              | Backup                    | Decision          | Rationale                                                                                                                                           |
| ----------------------- | -------------------------------- | ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate Customer model | Yes (Customer + CustomerProfile) | No (only CustomerProfile) | REQUIRES DECISION | Dev has legacy Customer model alongside CustomerProfile; backup is cleaner. Recommend: keep dev's CustomerProfile only, drop legacy Customer model. |

### Worker Model

| Aspect    | Dev                                                                             | Backup                                                                                                                                            | Decision          | Rationale                                                                                                                       |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Name      | Worker                                                                          | WorkerProfile                                                                                                                                     | KEEP DEV          | Dev is the base; renaming is cosmetic                                                                                           |
| Fields    | bio?, experienceYears, profilePhoto?, paymentRate?, availability?, ratingAvg    | bio (required), experience (required), baseRate?, averageRating, profileImageUrl?, profileImagePublicId?, verifiedJobCount, verifiedEarningsTotal | REQUIRES DECISION | Backup has more fields. Recommend: keep dev's field names, add backup's useful fields (verifiedJobCount, verifiedEarningsTotal) |
| Relations | Portfolio[], Certificate[], Service[], Application[], Review[], PaymentAccount? | PortfolioItem[], Certificate[], WorkerService[], Application[], Review[], PaymentAccount?                                                         | KEEP DEV          | Different relation names but same concepts                                                                                      |

### Category/Service Models

| Aspect            | Dev                                       | Backup                                    | Decision | Rationale                                              |
| ----------------- | ----------------------------------------- | ----------------------------------------- | -------- | ------------------------------------------------------ |
| Category model    | Category                                  | ServiceCategory                           | KEEP DEV | Dev is the base                                        |
| Service model     | Service (individual services with prices) | WorkerService (join table)                | KEEP DEV | More expressive; services have prices and descriptions |
| Service relations | Worker has Service[]                      | Worker has WorkerService[] (many-to-many) | KEEP DEV | Dev's model is more complete                           |

### Job Model

| Aspect         | Dev                                                                             | Backup                                          | Decision | Rationale               |
| -------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- | -------- | ----------------------- |
| JobSource enum | POSTING, DIRECT                                                                 | MARKETPLACE, DIRECT_HIRE                        | KEEP DEV | Dev is the base         |
| JobStatus enum | 7 states (OPEN, PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, DECLINED) | 4 states (OPEN, ASSIGNED, COMPLETED, CANCELLED) | KEEP DEV | More complete lifecycle |
| Fields         | Standard                                                                        | Standard                                        | KEEP DEV | Same core fields        |

### Application Model

| Aspect             | Dev                                               | Backup                                 | Decision          | Rationale                                                                                 |
| ------------------ | ------------------------------------------------- | -------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| ApplicationStatus  | 4 states (PENDING, ACCEPTED, REJECTED, WITHDRAWN) | 3 states (PENDING, ACCEPTED, REJECTED) | KEEP DEV          | WITHDRAWN state needed                                                                    |
| estimatedTime type | String                                            | Int                                    | REQUIRES DECISION | Backup's Int is more structured. Recommend: keep dev's String for flexibility             |
| Relations          | Job, Worker                                       | Job, Worker, Payment[]                 | REQUIRES DECISION | Backup has Payment relation. Recommend: keep dev's model but add applicationId to Payment |

### Payment Model

| Aspect        | Dev    | Backup  | Decision         | Rationale                                      |
| ------------- | ------ | ------- | ---------------- | ---------------------------------------------- |
| applicationId | Absent | Present | PORT FROM BACKUP | Needed to link payment to specific application |
| Other fields  | Same   | Same    | KEEP DEV         | Core fields identical                          |

### Review Model

| Aspect            | Dev                                    | Backup                        | Decision          | Rationale                       |
| ----------------- | -------------------------------------- | ----------------------------- | ----------------- | ------------------------------- |
| reviewerRole      | CUSTOMER_TO_WORKER, WORKER_TO_CUSTOMER | Absent                        | KEEP DEV          | Bidirectional reviews supported |
| Unique constraint | @@unique([jobId, reviewerRole])        | @@unique([jobId, customerId]) | KEEP DEV          | More flexible                   |
| comment           | Optional                               | Required                      | REQUIRES DECISION | Recommend: keep optional (dev)  |

### New Models

| Model        | Dev            | Backup           | Decision          | Rationale                                                                                    |
| ------------ | -------------- | ---------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Notification | Absent         | Present          | PORT FROM BACKUP  | Needed for in-app notifications                                                              |
| Portfolio    | Portfolio      | PortfolioItem    | KEEP DEV          | Dev is the base                                                                              |
| Certificate  | Has issuedDate | Has filePublicId | REQUIRES DECISION | Both have useful fields. Recommend: merge (keep dev's issuedDate, add backup's filePublicId) |

---

## 2. Enums

| Enum                 | Dev                                    | Backup                    | Decision | Rationale        |
| -------------------- | -------------------------------------- | ------------------------- | -------- | ---------------- |
| SystemRole           | USER, ADMIN                            | USER, ADMIN               | KEEP DEV | Same             |
| ActiveRole           | CUSTOMER, WORKER                       | CUSTOMER, WORKER          | KEEP DEV | Same             |
| Role                 | CUSTOMER, WORKER, BUSINESS, ADMIN      | Absent                    | KEEP DEV | Needed for auth  |
| UserStatus           | PENDING, ACTIVE, SUSPENDED             | Absent                    | KEEP DEV | Needed for admin |
| JobSource            | POSTING, DIRECT                        | MARKETPLACE, DIRECT_HIRE  | KEEP DEV | Dev is the base  |
| JobStatus            | 7 states                               | 4 states                  | KEEP DEV | More complete    |
| ApplicationStatus    | 4 states                               | 3 states                  | KEEP DEV | WITHDRAWN needed |
| ReviewerRole         | CUSTOMER_TO_WORKER, WORKER_TO_CUSTOMER | Absent                    | KEEP DEV | Bidirectional    |
| PaymentMethod        | CASH, CHAPA                            | CASH, CHAPA               | KEEP DEV | Same             |
| PaymentStatus        | PENDING, PAID, FAILED                  | PENDING, PAID, FAILED     | KEEP DEV | Same             |
| PaymentProvider      | CHAPA                                  | CHAPA                     | KEEP DEV | Same             |
| PaymentAccountStatus | ACTIVE, PENDING, REJECTED              | ACTIVE, PENDING, REJECTED | KEEP DEV | Same             |

---

## 3. Error Handling

| Aspect                 | Dev                                 | Backup                             | Decision         | Rationale                                        |
| ---------------------- | ----------------------------------- | ---------------------------------- | ---------------- | ------------------------------------------------ |
| Error classes location | src/middlewares/error.middleware.ts | src/errors/app-error.ts            | PORT FROM BACKUP | Cleaner separation; error classes not middleware |
| AppError               | Yes                                 | Yes                                | PORT FROM BACKUP | Backup's is slightly cleaner                     |
| BadRequestError        | Yes                                 | Yes                                | PORT FROM BACKUP | Consistent                                       |
| UnauthorizedError      | Yes                                 | Yes                                | PORT FROM BACKUP | Consistent                                       |
| ForbiddenError         | Yes                                 | Yes                                | PORT FROM BACKUP | Consistent                                       |
| NotFoundError          | Yes                                 | Yes                                | PORT FROM BACKUP | Consistent                                       |
| ConflictError          | Yes                                 | Yes                                | PORT FROM BACKUP | Consistent                                       |
| errorHandler           | In error.middleware.ts              | In middlewares/error.middleware.ts | PORT FROM BACKUP | Same pattern, cleaner location                   |

---

## 4. Middleware

| Middleware      | Dev                                               | Backup                                                       | Decision         | Rationale                                       |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------ | ---------------- | ----------------------------------------------- |
| authenticate    | Inline in routes                                  | Separate auth.middleware.ts with authenticate + optionalAuth | PORT FROM BACKUP | Cleaner separation                              |
| requireRole     | role.middleware.ts (checks Worker table fallback) | active-role.middleware.ts + authorization.middleware.ts      | PORT FROM BACKUP | Better separation of concerns                   |
| validate        | validate.middleware.ts                            | validate.middleware.ts                                       | PORT FROM BACKUP | Backup's supports body shorthand + multi-schema |
| asyncHandler    | Not present (manual try/catch)                    | utils/async-handler.ts                                       | PORT FROM BACKUP | Cleaner controller pattern                      |
| errorHandler    | In error.middleware.ts                            | In middlewares/error.middleware.ts                           | PORT FROM BACKUP | Cleaner                                         |
| Rate limiting   | express-rate-limit                                | express-rate-limit                                           | KEEP DEV         | Same                                            |
| CORS            | cors                                              | cors                                                         | KEEP DEV         | Same                                            |
| Body parser     | express.json, express.urlencoded                  | express.json, express.urlencoded                             | KEEP DEV         | Same                                            |
| Request logging | None                                              | morgan                                                       | PORT FROM BACKUP | Useful for development                          |

---

## 5. Authentication

| Aspect            | Dev                     | Backup                                  | Decision         | Rationale              |
| ----------------- | ----------------------- | --------------------------------------- | ---------------- | ---------------------- |
| JWT tokens        | Yes                     | Yes                                     | KEEP DEV         | Same pattern           |
| extractToken      | Not separate            | Separate utility                        | PORT FROM BACKUP | Cleaner                |
| verifyToken       | Not separate            | Separate utility                        | PORT FROM BACKUP | Cleaner                |
| Token storage     | Authorization header    | Authorization header + cookies          | PORT FROM BACKUP | More flexible          |
| registerUser      | Yes (with registerUser) | No registerUser                         | KEEP DEV         | Dev has more features  |
| loginWithTelegram | Creates Customer only   | Creates CustomerProfile + WorkerProfile | PORT FROM BACKUP | More complete on login |

---

## 6. Authorization

| Aspect          | Dev                                   | Backup                                                  | Decision         | Rationale         |
| --------------- | ------------------------------------- | ------------------------------------------------------- | ---------------- | ----------------- |
| Model           | requireRole (single middleware)       | authenticate + requireActiveRole + authorize (3 layers) | PORT FROM BACKUP | More flexible     |
| Role checking   | String matching on req.user.role      | ActiveRole-based checking                               | PORT FROM BACKUP | Better separation |
| Worker fallback | Checks Worker table if role is WORKER | Not needed (activeRole handles this)                    | PORT FROM BACKUP | Cleaner           |

---

## 7. Features

| Feature                        | Dev                                                     | Backup                                                 | Decision          | Rationale                                                                                             |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| Search (GET /search/providers) | Yes                                                     | Yes (via workers GET)                                  | KEEP DEV          | Dev has dedicated search controller                                                                   |
| Direct hire                    | Yes (POST /jobs/direct, PATCH /jobs/:id/direct-respond) | No (jobs have source field but no dedicated endpoints) | KEEP DEV          | More complete                                                                                         |
| Onboarding                     | No                                                      | Yes (POST /onboarding, GET /onboarding)                | PORT FROM BACKUP  | Needed for UX                                                                                         |
| Payment (Chapa)                | Removed                                                 | Yes (checkout + webhook)                               | PORT FROM BACKUP  | Working integration                                                                                   |
| Cloudinary uploads             | Removed                                                 | Yes (signature + delete)                               | PORT FROM BACKUP  | Working integration                                                                                   |
| Notifications                  | Removed                                                 | Yes (CRUD + unread count)                              | PORT FROM BACKUP  | Needed for UX                                                                                         |
| Admin                          | Yes (dashboard, users, categories)                      | Yes (dashboard, users, roles)                          | KEEP DEV          | Dev is more complete                                                                                  |
| Worker self-service            | Yes (services, portfolios, certificates)                | Yes (services, portfolios, certificates)               | KEEP DEV          | Dev has more features                                                                                 |
| Reviews                        | Yes (bidirectional, CRUD)                               | Yes (unidirectional, limited CRUD)                     | KEEP DEV          | More complete                                                                                         |
| Applications                   | Yes (apply, accept, reject)                             | Yes (apply, accept, reject, withdraw)                  | PORT FROM BACKUP  | Withdraw needed                                                                                       |
| Profile management             | Yes (profiles/me)                                       | Yes (workers/me, customers)                            | REQUIRES DECISION | Different patterns. Recommend: keep dev's profiles/me for generic, add workers/me for worker-specific |

---

## 8. Response Format

| Aspect           | Dev                                            | Backup                                          | Decision         | Rationale   |
| ---------------- | ---------------------------------------------- | ----------------------------------------------- | ---------------- | ----------- |
| Success response | `{ success: true, data }`                      | `{ success: true, data }` + sendSuccess utility | PORT FROM BACKUP | Cleaner     |
| Error response   | `{ success: false, error: { code, message } }` | `{ success: false, error: { code, message } }`  | KEEP DEV         | Same format |
| Pagination       | Inline in responses                            | sendSuccess with meta parameter                 | PORT FROM BACKUP | Cleaner     |

---

## 9. Environment Variables

| Variable                    | Dev                         | Backup                      | Decision         | Rationale                   |
| --------------------------- | --------------------------- | --------------------------- | ---------------- | --------------------------- |
| DATABASE_URL                | Required                    | Required                    | KEEP DEV         | Same                        |
| PORT                        | Default 3000                | Default 3000                | KEEP DEV         | Same                        |
| NODE_ENV                    | development/test/production | development/test/production | KEEP DEV         | Same                        |
| FRONTEND_URL                | Default localhost:3000      | Default localhost:3000      | KEEP DEV         | Same                        |
| JWT_SECRET                  | Default value               | Required                    | PORT FROM BACKUP | No defaults for secrets     |
| JWT_REFRESH_SECRET          | Default value               | Absent                      | PORT FROM BACKUP | Not used; remove            |
| JWT_ACCESS_EXPIRES_IN       | Default 15m                 | Default 15m                 | KEEP DEV         | Same                        |
| JWT_REFRESH_EXPIRES_IN      | Default 7d                  | Absent                      | PORT FROM BACKUP | Not used; remove            |
| TELEGRAM_CLIENT_ID          | Default mock                | Required                    | PORT FROM BACKUP | No defaults for credentials |
| TELEGRAM_CLIENT_SECRET      | Default mock                | Required                    | PORT FROM BACKUP | No defaults for credentials |
| TELEGRAM_REDIRECT_URI       | Default localhost           | Required                    | PORT FROM BACKUP | No defaults                 |
| TELEGRAM_BOT_TOKEN          | Default mock                | Required                    | PORT FROM BACKUP | No defaults for credentials |
| TELEGRAM_OIDC_COOKIE_SECRET | Default value               | Required (min 32)           | PORT FROM BACKUP | No defaults for secrets     |
| CLOUDINARY_URL              | Absent                      | Required                    | PORT FROM BACKUP | New integration             |
| CHAPA_PUBLIC_KEY            | Absent                      | Required                    | PORT FROM BACKUP | New integration             |
| CHAPA_SECRET_KEY            | Absent                      | Required                    | PORT FROM BACKUP | New integration             |
| CHAPA_ENCRYPTION_KEY        | Absent                      | Required                    | PORT FROM BACKUP | New integration             |
| CHAPA_RETURN_URL            | Absent                      | Optional URL                | PORT FROM BACKUP | New integration             |
| CHAPA_CALLBACK_URL          | Absent                      | Optional URL                | PORT FROM BACKUP | New integration             |

---

## 10. Business Rules

| Rule                             | Dev                                             | Backup                                | Decision         | Rationale              |
| -------------------------------- | ----------------------------------------------- | ------------------------------------- | ---------------- | ---------------------- |
| Payment ≠ Job Completion         | No payment integration                          | Webhook does NOT set job to COMPLETED | PORT FROM BACKUP | Critical business rule |
| Customer controls completion     | updateJobStatus allows both customer and worker | completeJob requires CUSTOMER role    | PORT FROM BACKUP | More restrictive       |
| Terminal state protection        | Yes (blocks updates to COMPLETED/CANCELLED)     | Yes (blocks updates)                  | PORT FROM BACKUP | Same concept           |
| Review requires COMPLETED        | No explicit check                               | Checks job.status === COMPLETED       | PORT FROM BACKUP | Critical business rule |
| Self-review prevention           | No explicit check                               | Checks customerId === user's profile  | PORT FROM BACKUP | Important              |
| Duplicate application prevention | @@unique([jobId, workerId])                     | @@unique([jobId, workerId])           | KEEP DEV         | Same                   |
| Duplicate review prevention      | @@unique([jobId, reviewerRole])                 | @@unique([jobId, customerId])         | KEEP DEV         | More flexible          |
| Anti-self-hire                   | No check                                        | Checks targetWorker.userId !== userId | PORT FROM BACKUP | Important              |

---

## 11. Test Structure

| Aspect             | Dev             | Backup                             | Decision         | Rationale       |
| ------------------ | --------------- | ---------------------------------- | ---------------- | --------------- |
| Framework          | Vitest          | Vitest                             | KEEP DEV         | Same            |
| Structure          | tests/{module}/ | tests/{module}/                    | KEEP DEV         | Same            |
| Payment tests      | None            | Yes (payment.service.test.ts)      | PORT FROM BACKUP | New integration |
| Upload tests       | None            | Yes (upload.service.test.ts)       | PORT FROM BACKUP | New integration |
| Notification tests | None            | Yes (notification.service.test.ts) | PORT FROM BACKUP | New integration |
| Onboarding tests   | None            | Yes (onboarding.service.test.ts)   | PORT FROM BACKUP | New integration |

---

## Summary of Decisions

### From Dev (KEEP DEV)

- Prisma schema (models, enums, relations)
- Job lifecycle (7 states)
- Bidirectional reviews
- Search controller
- Direct hire endpoints
- Worker self-service
- Admin functionality
- Auth flow (JWT)
- Profile management

### From Backup (PORT FROM BACKUP)

- Error classes (src/errors/)
- asyncHandler utility
- sendSuccess utility
- authenticate + optionalAuth middleware
- requireActiveRole middleware
- authorize middleware
- validate middleware (body shorthand)
- extractToken + verifyToken utilities
- userSelect query
- Chapa integration (client, types, service, webhook)
- Cloudinary integration (upload service)
- Notification service + routes
- Onboarding service + routes
- Application withdrawal
- Payment model (add applicationId)
- Environment variable validation (no defaults for secrets)
- Business rules (payment ≠ completion, review requires COMPLETED, anti-self-hire)
- Terminal state protection

### Rejected from Backup

- 4-state job model (keep dev's 7 states)
- Unidirectional reviews (keep dev's bidirectional)
- Different model names (keep dev's Worker, Category, Service, Portfolio)

### Requires Decision

- Legacy Customer model (keep or drop?)
- WorkerProfile fields (which backup fields to add?)
- estimatedTime type (String vs Int)
- Review comment (optional vs required)
- Certificate fields (merge issuedDate + filePublicId?)
- Profile routes pattern (profiles/me vs workers/me)
