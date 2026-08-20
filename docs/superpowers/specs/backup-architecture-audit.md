# Backup Branch Architecture Audit

> Branch: `backup/feat/mvp-reference` (reference implementation)
> Date: 2026-08-20

## 1. Prisma Schema

### Enums

| Enum                 | Values                               | Notes                               |
| -------------------- | ------------------------------------ | ----------------------------------- |
| SystemRole           | USER, ADMIN                          |                                     |
| ActiveRole           | CUSTOMER, WORKER                     |                                     |
| JobSource            | MARKETPLACE, DIRECT_HIRE             | Different from dev's POSTING/DIRECT |
| JobStatus            | OPEN, ASSIGNED, COMPLETED, CANCELLED | 4 states (simpler than dev's 7)     |
| ApplicationStatus    | PENDING, ACCEPTED, REJECTED          | 3 states (no WITHDRAWN)             |
| PaymentMethod        | CASH, CHAPA                          |                                     |
| PaymentStatus        | PENDING, PAID, FAILED                |                                     |
| PaymentProvider      | CHAPA                                |                                     |
| PaymentAccountStatus | ACTIVE, PENDING, REJECTED            |                                     |

### Models

| Model           | Key Fields                                                                                                                                                             | Relations                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| User            | id, telegramId (unique), name, systemRole, lastActiveRole?                                                                                                             | → CustomerProfile?, → WorkerProfile?, → Notification[]                                                                                     |
| CustomerProfile | id, userId (unique), bio?                                                                                                                                              | → User, → Job[], → Review[]                                                                                                                |
| WorkerProfile   | id, userId (unique), bio (required), experience (required), baseRate?, averageRating, profileImageUrl?, profileImagePublicId?, verifiedJobCount, verifiedEarningsTotal | → User, → WorkerService[], → Job[] (targeted/assigned), → Application[], → Review[], → PortfolioItem[], → Certificate[], → PaymentAccount? |
| ServiceCategory | id, name (unique)                                                                                                                                                      | → WorkerService[], → Job[]                                                                                                                 |
| WorkerService   | workerProfileId, categoryId                                                                                                                                            | composite PK; → WorkerProfile, → ServiceCategory                                                                                           |
| Job             | id, customerId, targetWorkerId?, source, categoryId, title, description, budget, status, assignedWorkerId?                                                             | → CustomerProfile, → WorkerProfile? (target/assigned), → ServiceCategory, → Application[], → Payment[], → Review[]                         |
| Application     | id, jobId, workerId, proposedPrice, estimatedTime (Int), status                                                                                                        | → Job, → WorkerProfile, → Payment[]; @@unique([jobId, workerId])                                                                           |
| Payment         | id, jobId, applicationId, amount, currency, method, status, txRef (unique), platformCommission                                                                         | → Job, → Application                                                                                                                       |
| Review          | id, jobId, workerId, customerId, rating, comment (required)                                                                                                            | → Job, → WorkerProfile, → CustomerProfile; @@unique([jobId, customerId])                                                                   |
| PortfolioItem   | id, workerId, title, description, imageUrl, imagePublicId                                                                                                              | → WorkerProfile                                                                                                                            |
| Certificate     | id, workerId, title, fileUrl, filePublicId                                                                                                                             | → WorkerProfile                                                                                                                            |
| PaymentAccount  | id, workerProfileId (unique), provider, providerAccountId, status                                                                                                      | → WorkerProfile                                                                                                                            |
| Notification    | id, userId, title, message, isRead, type, link?                                                                                                                        | → User                                                                                                                                     |

### Notable differences from dev:

- NO Role enum, UserStatus, email, phone, passwordHash on User
- NO Customer legacy model
- WorkerProfile (not Worker) — different field names
- WorkerService join table (not Service model) — many-to-many
- ServiceCategory (not Category)
- PortfolioItem (not Portfolio) — has imagePublicId
- Certificate has filePublicId
- Payment has applicationId
- Review uses @@unique([jobId, customerId]) — single direction only
- Notification model exists
- Review comment is required (not optional)

## 2. Route Structure

```
POST   /api/v1/auth/telegram                    → loginWithTelegram
GET    /api/v1/auth/me                           → getCurrentUser
PATCH  /api/v1/auth/active-role                  → updateActiveRole

POST   /api/v1/onboarding                        → completeOnboarding [any auth]
GET    /api/v1/onboarding                        → getOnboardingStatus [any auth]

GET    /api/v1/categories                        → getCategories
POST   /api/v1/categories                        → createCategory [ADMIN]
GET    /api/v1/categories/:id                    → getCategoryById

GET    /api/v1/workers                           → getWorkers (search/filter)
GET    /api/v1/workers/me                        → getMyProfile [WORKER]
PUT    /api/v1/workers/me                        → updateMyProfile [WORKER]
GET    /api/v1/workers/:id                       → getPublicProfile
GET    /api/v1/workers/me/services               → getMyServices [WORKER]
POST   /api/v1/workers/me/services               → createService [WORKER]
PUT    /api/v1/workers/me/services/:id           → updateService [WORKER]
DELETE /api/v1/workers/me/services/:id           → deleteService [WORKER]
POST   /api/v1/workers/me/portfolios             → createPortfolio [WORKER]
DELETE /api/v1/workers/me/portfolios/:id         → deletePortfolio [WORKER]
POST   /api/v1/workers/me/certificates           → createCertificate [WORKER]
DELETE /api/v1/workers/me/certificates/:id       → deleteCertificate [WORKER]

GET    /api/v1/jobs                              → getPublicJobs
POST   /api/v1/jobs                              → createJob [CUSTOMER]
GET    /api/v1/jobs/me                           → getMyJobs [CUSTOMER]
GET    /api/v1/jobs/worker/me                    → getWorkerJobs [WORKER]
GET    /api/v1/jobs/:id                          → getJobById
PUT    /api/v1/jobs/:id                          → updateJob [CUSTOMER]
PATCH  /api/v1/jobs/:id/status                   → updateJobStatus
PATCH  /api/v1/jobs/:id/complete                 → completeJob [CUSTOMER]

POST   /api/v1/applications                      → applyToJob [WORKER]
GET    /api/v1/applications/my                   → getMyApplications [WORKER]
DELETE /api/v1/applications/:id                  → withdrawApplication [WORKER]
GET    /api/v1/applications/job/:jobId           → getJobApplications [CUSTOMER]
PATCH  /api/v1/applications/:id/accept           → acceptApplication [CUSTOMER]
PATCH  /api/v1/applications/:id/reject           → rejectApplication [CUSTOMER]

POST   /api/v1/reviews                           → createReview [CUSTOMER]
GET    /api/v1/reviews                           → getReviews
GET    /api/v1/reviews/worker/:id                → getWorkerReviews
PUT    /api/v1/reviews/:id                       → updateReview [CUSTOMER]
DELETE /api/v1/reviews/:id                       → deleteReview [CUSTOMER]
GET    /api/v1/reviews/my                        → getMyReviews [any auth]

POST   /api/v1/payments/checkout                 → createCheckout [CUSTOMER]
POST   /api/v1/payments/webhook                  → handleWebhook (Chapa callback)

POST   /api/v1/uploads/signature                  → generateSignature [any auth]
DELETE /api/v1/uploads/:publicId                  → deleteUpload [any auth]

GET    /api/v1/notifications                      → getNotifications [any auth]
GET    /api/v1/notifications/unread-count          → getUnreadCount [any auth]
PATCH  /api/v1/notifications/:id/read             → markAsRead [any auth]
PATCH  /api/v1/notifications/read-all             → markAllAsRead [any auth]

GET    /api/v1/admin/dashboard                    → getDashboardStats [ADMIN]
GET    /api/v1/admin/users                        → getAllUsers [ADMIN]
PATCH  /api/v1/admin/users/:id/role               → updateUserRole [ADMIN]
```

### Notable differences from dev routes:

- Has onboarding routes (POST /onboarding, GET /onboarding)
- Has payment routes (POST /payments/checkout, POST /payments/webhook)
- Has upload routes (POST /uploads/signature, DELETE /uploads/:publicId)
- Has notification routes (4 endpoints)
- Worker routes use /me prefix pattern (e.g., /workers/me/services)
- No direct hire routes (handled differently — jobs have source field but no separate direct-respond endpoint)
- Has /jobs/worker/me for worker's job view
- No profile routes (profiles accessed via workers/me and customers)
- No search routes (search handled by workers GET with query params)
- No auth/register endpoint

## 3. Service Boundaries

### auth.service

- generateTokens(userId, role) → AuthTokensDto
- getCurrentUser(userId) → UserPublicDto
- updateActiveRole(userId, activeRole) → UserPublicDto (with cache invalidation)
- loginWithTelegram(telegram) → LoginResponseDto

### onboarding.service

- getOnboardingStatus(userId) → OnboardingStatus
- completeOnboarding(userId, dto) → User (idempotent — returns existing if already done)

### job.service

- createJob(userId, data) → Job
- getPublicJobs(query) → { jobs, meta }
- getMyJobs(userId) → Job[] (customer jobs)
- getWorkerJobs(userId) → Job[] (worker jobs)
- getJobById(jobId) → Job
- updateJob(userId, jobId, data) → Job
- updateJobStatus(userId, jobId, data) → Job (with terminal state protection)
- completeJob(userId, jobId) → Job

### worker.service

- getWorkers(query) → { workers, meta }
- getWorkerById(workerId) → WorkerProfile
- getMyProfile(userId) → WorkerProfile
- updateMyProfile(userId, data) → WorkerProfile
- getPublicProfile(workerId) → WorkerProfile
- getMyServices(userId) → WorkerService[]
- createService(userId, data) → WorkerService
- updateService(userId, serviceId, data) → WorkerService
- deleteService(userId, serviceId) → void
- createPortfolio(userId, data) → PortfolioItem
- deletePortfolio(userId, portfolioId) → void
- createCertificate(userId, data) → Certificate
- deleteCertificate(userId, certificateId) → void

### application.service

- applyToJob(userId, data) → Application
- getJobApplications(userId, jobId) → Application[]
- getMyApplications(userId) → Application[] (with pagination)
- acceptApplication(userId, applicationId) → Application
- rejectApplication(userId, applicationId) → Application
- withdrawApplication(userId, applicationId) → Application

### review.service

- createReview(userId, data) → Review
- getWorkerReviews(workerId, query) → { reviews, meta }
- getMyReviews(userId, query) → { reviews, meta }
- updateReview(userId, reviewId, data) → Review
- deleteReview(userId, reviewId) → void

### profile.service

- getMyProfile(userId) → Profile (customer or worker based on activeRole)
- updateMyProfile(userId, data) → Profile

### category.service

- getCategories() → Category[]
- getCategoryById(categoryId) → Category
- createCategory(data) → Category

### payment.service

- createCheckout(customerId, applicationId) → { checkoutUrl, txRef }

### payment-webhook.service

- handleSuccessfulPayment(txRef) → { payment } (idempotent)

### upload.service

- generateUploadSignature(userId, uploadType) → { signature, timestamp, apiKey, cloudName, folder }
- deleteFile(publicId, userId) → void (with ownership check)

### notification.service

- getUserNotifications(userId, query) → { notifications, meta }
- getUnreadCount(userId) → { count }
- markAsRead(userId, notificationId) → Notification
- markAllAsRead(userId) → { count }
- createNotification(userId, title, message, type, link?) → Notification

### admin.service

- getDashboardStats() → Stats
- getAllUsers(query) → { users, meta }
- updateUserRole(userId, role) → User

## 4. Middleware Stack

1. CORS (cors middleware)
2. Rate limiting (rateLimit from express-rate-limit)
3. Body parser (express.json, express.urlencoded)
4. Request logging (morgan in development)
5. Routes → middleware per route group:
   - Public routes: no auth
   - Optional auth routes: optionalAuth
   - Authenticated routes: authenticate
   - Role-restricted routes: authenticate + requireActiveRole(roles) OR authorize(roles)
6. 404 handler
7. Error handler (errorHandler)

### Error Model

- AppError base class with statusCode + ErrorCode
- Subclasses: BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError
- Error middleware: AppError → JSON response, ZodError → field-level errors, else 500

### Auth Model

- JWT-based (jsonwebtoken library)
- Token extraction via extractToken utility (checks Authorization header, then cookies)
- Token verification via verifyToken utility
- User attached to req.user as { id, role }

### Authorization Model (3 layers)

- authenticate: attaches req.user from JWT (required)
- optionalAuth: attaches req.user if token present (optional)
- requireActiveRole(roles): checks req.user.role against allowed roles
- authorize(roles): alternative role check (from backup routes)

### Validation

- Zod schemas validated via validate middleware
- Supports body, params, query validation
- Supports single schema or multi-schema object

### Active Role Cache

- In-memory Map cache for active role lookups
- invalidateActiveRoleCache(userId) for cache busting

## 5. Error Handling

Centralized in `src/middlewares/error.middleware.ts`:

- AppError → `{ success: false, error: { code, message } }` with proper status
- ZodError → `{ success: false, error: { code: "VALIDATION_ERROR", message, fields? } }`
- Unknown → 500 with generic message

Separate from error classes in `src/errors/`:

- AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError
- Exported from `src/errors/index.ts`

## 6. Utilities

### async-handler.ts

- Wraps async route handlers to catch errors and pass to next()

### response.util.ts

- sendSuccess(res, data, statusCode, meta?) → standardized success response

### queries/user.queries.ts

- userSelect: shared Prisma select shape for User with customerProfile and workerProfile

## 7. Infrastructure Integrations

### Chapa Payment Gateway

- `src/lib/chapa/chapa.client.ts`: ChapaGateway class
  - initializeCheckout(input) → ChapaInitializeResponse
  - verifyPayment(txRef) → ChapaVerifyResponse
  - verifyWebhookSignature(payload, signature) → boolean (timing-safe)
- `src/types/chapa.ts`: Chapa types
- txRef format: `sh_{8chars}_{6digits}` (max 50 chars)

### Cloudinary

- `src/services/upload.service.ts`: SDK auto-detects CLOUDINARY_URL
  - generateUploadSignature(userId, uploadType) — profile/portfolio/certificate
  - deleteFile(publicId, userId) — ownership check via path prefix

### Notifications

- In-app notification system via Notification model
- Create, list, mark read, unread count
- No external push integration

## 8. Test Structure

```
tests/
├── auth/
├── jobs/
├── workers/
├── applications/
├── reviews/
├── profiles/
├── categories/
├── admin/
├── onboarding/
├── payments/
├── uploads/
├── notifications/
└── setup/
```

Uses Vitest with Prisma test utilities.
