# Dev Branch Architecture Audit

> Branch: `dev` (authoritative base for consolidation)
> Date: 2026-08-20

## 1. Prisma Schema

### Enums

| Enum                 | Values                                                               | Notes                              |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| SystemRole           | USER, ADMIN                                                          |                                    |
| ActiveRole           | CUSTOMER, WORKER                                                     |                                    |
| Role                 | CUSTOMER, WORKER, BUSINESS, ADMIN                                    | User-level role; also used for JWT |
| UserStatus           | PENDING, ACTIVE, SUSPENDED                                           |                                    |
| JobSource            | POSTING, DIRECT                                                      |                                    |
| JobStatus            | OPEN, PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, DECLINED | 7 states                           |
| ApplicationStatus    | PENDING, ACCEPTED, REJECTED, WITHDRAWN                               | 4 states                           |
| ReviewerRole         | CUSTOMER_TO_WORKER, WORKER_TO_CUSTOMER                               | Bidirectional reviews              |
| PaymentMethod        | CASH, CHAPA                                                          |                                    |
| PaymentStatus        | PENDING, PAID, FAILED                                                |                                    |
| PaymentProvider      | CHAPA                                                                |                                    |
| PaymentAccountStatus | ACTIVE, PENDING, REJECTED                                            |                                    |

### Models

| Model           | Key Fields                                                                                                 | Relations                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| User            | id, telegramId?, name, email?, phone?, passwordHash?, role?, status?, systemRole, lastActiveRole?          | → CustomerProfile, → Customer (legacy), → Worker                                                                                 |
| Customer        | id, userId (unique)                                                                                        | → User                                                                                                                           |
| CustomerProfile | id, userId (unique), bio?, ratingAvg                                                                       | → User, → Job[], → Review[]                                                                                                      |
| Worker          | id, userId (unique), bio?, experienceYears, profilePhoto?, paymentRate?, availability?, ratingAvg          | → User, → Portfolio[], → Certificate[], → Service[], → Job[] (targeted/assigned), → Application[], → Review[], → PaymentAccount? |
| Category        | id, name (unique), description?                                                                            | → Service[], → Job[]                                                                                                             |
| Service         | id, categoryId, providerId, name, description?, price?                                                     | → Category, → Worker                                                                                                             |
| Portfolio       | id, workerId, title, description, imageUrl                                                                 | → Worker                                                                                                                         |
| Certificate     | id, workerId, title, fileUrl, issuedDate?                                                                  | → Worker                                                                                                                         |
| Job             | id, customerId, targetWorkerId?, source, categoryId, title, description, budget, status, assignedWorkerId? | → CustomerProfile, → Worker? (target/assigned), → Category, → Application[], → Payment[], → Review[]                             |
| Application     | id, jobId, workerId, proposedPrice, estimatedTime, status                                                  | → Job, → Worker; @@unique([jobId, workerId])                                                                                     |
| Payment         | id, jobId, amount, currency, method, status, txRef (unique), platformCommission                            | → Job                                                                                                                            |
| Review          | id, jobId, workerId, customerId, reviewerRole, rating, comment?                                            | → Job, → Worker, → CustomerProfile; @@unique([jobId, reviewerRole])                                                              |
| PaymentAccount  | id, workerProfileId (unique), provider, providerAccountId, status                                          | → Worker                                                                                                                         |

### Notable: User model has email, phone, passwordHash, Role enum, UserStatus fields

### Notable: Review uses @@unique([jobId, reviewerRole]) — allows bidirectional reviews

### Notable: Payment has NO applicationId — links to Job only

### Notable: Customer legacy model (Customer) alongside CustomerProfile

## 2. Route Structure

```
POST   /api/v1/auth/telegram                    → loginWithTelegram
POST   /api/v1/auth/register                    → registerUser
GET    /api/v1/auth/me                           → getCurrentUser
PATCH  /api/v1/auth/active-role                  → updateActiveRole

GET    /api/v1/categories                        → getCategories
POST   /api/v1/categories                        → createCategory [ADMIN]
GET    /api/v1/categories/:id                    → getCategoryById
PUT    /api/v1/categories/:id                    → updateCategory [ADMIN]
DELETE /api/v1/categories/:id                    → deleteCategory [ADMIN]

GET    /api/v1/profiles/me                       → getMyProfile [any auth]
PUT    /api/v1/profiles/me                       → updateMyProfile [any auth]

GET    /api/v1/workers                           → getWorkers (search/filter)
GET    /api/v1/workers/me                        → getMyWorkerProfile [WORKER]
GET    /api/v1/workers/:id                       → getPublicWorkerProfile
POST   /api/v1/workers/services                  → createService [WORKER]
PUT    /api/v1/workers/services/:id              → updateService [WORKER]
DELETE /api/v1/workers/services/:id              → deleteService [WORKER]
POST   /api/v1/workers/portfolios                → createPortfolio [WORKER]
DELETE /api/v1/workers/portfolios/:id            → deletePortfolio [WORKER]
POST   /api/v1/workers/certificates              → createCertificate [WORKER]
DELETE /api/v1/workers/certificates/:id          → deleteCertificate [WORKER]

GET    /api/v1/customers/me                      → getMyCustomerProfile [CUSTOMER]

GET    /api/v1/search/providers                  → searchProviders

GET    /api/v1/jobs                              → getPublicJobs
POST   /api/v1/jobs                              → createJob [CUSTOMER]
POST   /api/v1/jobs/direct                       → createDirectJob [CUSTOMER]
GET    /api/v1/jobs/me                           → getMyJobs [CUSTOMER]
GET    /api/v1/jobs/:id                          → getJobById
PUT    /api/v1/jobs/:id                          → updateJob [CUSTOMER]
PATCH  /api/v1/jobs/:id/status                   → updateJobStatus
PATCH  /api/v1/jobs/:id/direct-respond           → respondToDirectJob [WORKER]
PATCH  /api/v1/jobs/:id/complete                 → completeJob [CUSTOMER]

POST   /api/v1/applications                      → applyToJob [WORKER]
GET    /api/v1/applications/my                   → getMyApplications [WORKER]
GET    /api/v1/applications/job/:jobId           → getJobApplications [CUSTOMER]
PATCH  /api/v1/applications/:id/accept           → acceptApplication [CUSTOMER]
PATCH  /api/v1/applications/:id/reject           → rejectApplication [CUSTOMER]

POST   /api/v1/reviews                           → createReview [CUSTOMER]
GET    /api/v1/reviews                           → getReviews
GET    /api/v1/reviews/worker/:id                → getWorkerReviews
GET    /api/v1/reviews/customer/me               → getCustomerReviews [CUSTOMER]

POST   /api/v1/admin/categories                  → createCategory [ADMIN]
DELETE /api/v1/admin/categories/:id              → deleteCategory [ADMIN]
GET    /api/v1/admin/users                       → getAllUsers [ADMIN]
PATCH  /api/v1/admin/users/:id/role              → updateUserRole [ADMIN]
GET    /api/v1/admin/stats                       → getDashboardStats [ADMIN]
```

## 3. Service Boundaries

### auth.service

- generateTokens(userId, role) → AuthTokensDto
- getCurrentUser(userId) → UserPublicDto
- updateActiveRole(userId, activeRole) → UserPublicDto
- registerUser(data) → UserPublicDto
- loginWithTelegram(telegram) → LoginResponseDto

### job.service

- createJob(userId, data) → Job
- createDirectJob(userId, data) → Job (direct hire)
- getPublicJobs(query) → { jobs, meta }
- getMyJobs(userId, lastActiveRole) → Job[]
- getJobById(jobId, requestUserId?) → Job (includes applications for owner)
- updateJob(userId, jobId, data) → Job (only OPEN)
- respondToDirectJob(userId, jobId, data) → Job (accept/decline)
- updateJobStatus(userId, jobId, data) → Job (COMPLETED/CANCELLED with terminal state protection)

### worker.service

- getWorkers(query) → { workers, meta } (search/filter)
- getWorkerById(workerId) → Worker
- getMyProfile(userId) → Worker
- updateMyProfile(userId, data) → Worker
- getPublicProfile(workerId) → Worker
- getMyServices(userId) → Service[]
- createService(userId, data) → Service
- updateService(userId, serviceId, data) → Service
- deleteService(userId, serviceId) → void
- createPortfolio(userId, data) → Portfolio
- deletePortfolio(userId, portfolioId) → void
- createCertificate(userId, data) → Certificate
- deleteCertificate(userId, certificateId) → void

### application.service

- applyToJob(userId, data) → Application
- getJobApplications(userId, jobId) → Application[]
- getMyApplications(userId) → Application[]
- acceptApplication(userId, applicationId) → Application
- rejectApplication(userId, applicationId) → Application
- withdrawApplication(userId, applicationId) → Application

### review.service

- createReview(userId, data) → Review
- getWorkerReviews(workerId) → Review[]
- getCustomerReviews(userId) → Review[]
- getMyReviews(userId) → Review[]
- updateReview(userId, reviewId, data) → Review
- deleteReview(userId, reviewId) → void
- recalculateWorkerRatingAvg(workerId) → void
- recalculateCustomerRatingAvg(customerId) → void

### profile.service

- getMyProfile(userId) → Profile
- updateMyProfile(userId, data) → Profile

### category.service

- getCategories() → Category[]
- getCategoryById(categoryId) → Category
- createCategory(data) → Category
- updateCategory(categoryId, data) → Category
- deleteCategory(categoryId) → void

### admin.service

- getDashboardStats() → Stats
- getAllUsers(query) → { users, meta }
- updateUserRole(userId, role) → User

## 4. Middleware Stack

1. CORS (cors middleware)
2. Body parser (express.json, express.urlencoded)
3. Rate limiting (rateLimit)
4. Health check (unprotected GET /api/health)
5. Routes → auth middleware inline per route
6. 404 handler
7. Error handler (errorHandler from error.middleware)

### Error Model

- AppError base class with statusCode + ErrorCode
- Subclasses: BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError
- Error middleware: AppError → JSON response, ZodError → field-level errors, else 500

### Auth Model

- JWT-based (jsonwebtoken library)
- Token extraction from Authorization header (Bearer token)
- Token verification via verifyToken function
- User attached to req.user as { id, role }

### Authorization Model

- requireRole middleware: checks allowedRoles array
- Falls back to checking Worker table for WORKER role
- Simple string matching on req.user.role

## 5. Error Handling

Centralized in `src/middlewares/error.middleware.ts`:

- AppError → `{ success: false, error: { code, message } }` with proper status
- ZodError → `{ success: false, error: { code: "VALIDATION_ERROR", message, fields? } }`
- Unknown → 500 with generic message

## 6. Test Structure

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
└── setup/
```

Uses Vitest with Prisma test utilities.
