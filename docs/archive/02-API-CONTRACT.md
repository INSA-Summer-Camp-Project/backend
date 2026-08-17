# ServiceHub — API Contract (Frozen)

**Status: this is the source of truth for request/response shapes.** Backend implements to it exactly. Frontend mocks and builds to it exactly. Any change follows `01-PARALLEL-DEVELOPMENT-PROCESS.md` §4 — update this file in the same change, never let it go stale.

Base URL (local dev): `http://localhost:4000/api/v1`
All authenticated requests: `Authorization: Bearer <access_token>`

---

## 1. Standard Response Envelope

**Every** endpoint returns one of these two shapes. No endpoint ever returns a bare array or bare object at the top level — this is what lets the frontend write one generic response handler instead of a bespoke one per endpoint.

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is present only where relevant (e.g. pagination) — omit it otherwise, don't send `"meta": null`.

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Budget must be a positive number.",
    "fields": {
      "budget": "Must be a positive number"
    }
  }
}
```

`fields` is present only for validation errors (400s tied to a form). `code` is a **stable machine-readable string** — frontend should branch logic on `code`, never on parsing `message`.

### Standard error codes

| Code                      | HTTP status | Meaning                                               |
| ------------------------- | ----------- | ----------------------------------------------------- |
| `VALIDATION_ERROR`        | 400         | Request body failed validation                        |
| `UNAUTHENTICATED`         | 401         | Missing/invalid/expired access token                  |
| `FORBIDDEN`               | 403         | Valid token, wrong role or not the resource owner     |
| `NOT_FOUND`               | 404         | Resource doesn't exist                                |
| `CONFLICT`                | 409         | e.g. profile already exists, duplicate action         |
| `SELF_ACTION_NOT_ALLOWED` | 403         | User attempted to apply to / hire / review themselves |
| `INTERNAL_ERROR`          | 500         | Unhandled server error                                |

### Pagination convention

Request: `?page=1&limit=20` (1-indexed, default `limit=20`, max `limit=50`)
Response `meta`:

```json
{ "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
```

### Formatting conventions

- IDs: UUID strings.
- Dates/times: ISO 8601 strings, UTC (`"2026-08-17T09:30:00Z"`).
- Money: **decimal string**, not a float — `"500.00"`, not `500.0`. Applies to `budget`, `proposed_price`, `amount`, `commission_amount`, `payment_rate`.

---

## 2. Auth

### `POST /auth/telegram/callback`

**Auth:** Public

```json
// Request
{
  "id": 123456789,
  "first_name": "Abebe",
  "last_name": "Tesfaye",
  "username": "abebe_t",
  "photo_url": "https://t.me/i/userpic/...",
  "auth_date": 1755417600,
  "hash": "a1b2c3..."
}
```

```json
// Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": {
      "id": "uuid",
      "name": "Abebe Tesfaye",
      "telegram_username": "abebe_t",
      "telegram_photo_url": "https://t.me/i/userpic/...",
      "is_admin": false
    },
    "profiles": ["customer"],
    "active_role": "customer",
    "last_active_role": "customer"
  }
}
```

`profiles` may be `[]` for a first-time user — frontend routes to onboarding in that case. `active_role` is `null` when `profiles` is `[]`.

### `POST /auth/onboarding/select-role`

**Auth:** User (active_role may be null)

```json
// Request
{ "role": "customer" }
```

```json
// Response 201
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "profiles": ["customer"],
    "active_role": "customer"
  }
}
```

### `POST /auth/switch-role`

**Auth:** User (must already hold the requested profile)

```json
// Request
{ "role": "worker" }
```

```json
// Response 200
{
  "success": true,
  "data": { "access_token": "eyJ...", "active_role": "worker" }
}
```

```json
// Error 400 — profile doesn't exist yet
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "You don't have a worker profile yet. Create one first."
  }
}
```

### `POST /auth/become-worker` / `POST /auth/become-customer`

**Auth:** User

```json
// Response 201
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "profiles": ["customer", "worker"],
    "active_role": "worker"
  }
}
```

### `GET /auth/me`

**Auth:** User

```json
// Response 200
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Abebe Tesfaye",
      "telegram_username": "abebe_t",
      "phone": null
    },
    "profiles": ["customer", "worker"],
    "active_role": "worker",
    "last_active_role": "worker"
  }
}
```

### `POST /auth/refresh`

**Auth:** Refresh token (in body)

```json
// Request
{ "refresh_token": "eyJ..." }
```

```json
// Response 200
{
  "success": true,
  "data": { "access_token": "eyJ...", "refresh_token": "eyJ..." }
}
```

### `POST /auth/logout`

**Auth:** User — Request: `{ "refresh_token": "eyJ..." }` — Response: `{ "success": true, "data": {} }`

---

## 3. Worker Profile

### `PATCH /workers/me`

**Auth:** worker

```json
// Request (all fields optional — partial update)
{
  "bio": "Licensed plumber, 6 years experience in Addis Ababa.",
  "experience_years": 6,
  "availability": "Mon–Sat, 8am–6pm",
  "pricing_type": "fixed",
  "payment_rate": "500.00",
  "services": [
    { "category_id": "uuid", "name": "Pipe repair", "price": "500.00" },
    { "category_id": "uuid", "name": "Installation", "price": "1200.00" }
  ]
}
```

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "bio": "Licensed plumber, 6 years experience in Addis Ababa.",
    "experience_years": 6,
    "profile_photo_url": "https://.../abebe.jpg",
    "availability": "Mon–Sat, 8am–6pm",
    "pricing_type": "fixed",
    "payment_rate": "500.00",
    "rating_avg": 0,
    "rating_count": 0,
    "services": [
      {
        "id": "uuid",
        "category_id": "uuid",
        "category_name": "Plumbing",
        "name": "Pipe repair",
        "price": "500.00"
      }
    ]
  }
}
```

### `GET /workers/:id`

**Auth:** Public

```json
// Response 200 — same shape as PATCH response above, plus:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Abebe Tesfaye",
    "verified": false
    /* ...all fields from PATCH response... */
  }
}
```

`name` is pulled from `users.name` server-side — frontend never needs a second call to resolve the owner's display name.

---

## 4. Search

### `GET /search/providers?category=uuid&rating_min=4&sort=rating&page=1&limit=20`

**Auth:** Public

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Abebe Tesfaye",
      "profile_photo_url": "https://.../abebe.jpg",
      "verified": false,
      "rating_avg": 4.8,
      "rating_count": 126,
      "categories": ["Plumbing"],
      "from_price": "500.00",
      "pricing_type": "fixed"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 34, "totalPages": 2 }
}
```

### `GET /search/jobs?category=uuid&status=open&page=1&limit=20`

**Auth:** worker (browsing open jobs to apply to)

```json
// Response 200 — array shape mirrors /search/providers
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Fix kitchen sink leak",
      "category_name": "Plumbing",
      "budget": "800.00",
      "deadline": "2026-08-25",
      "customer_name": "Sara A.",
      "application_count": 3,
      "created_at": "2026-08-17T09:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

---

## 5. Direct Hire

### `POST /hiring/direct-hire`

**Auth:** customer

```json
// Request
{ "worker_id": "uuid", "note": "Need this fixed today if possible" }
```

```json
// Response 201
{
  "success": true,
  "data": {
    "hire_id": "uuid",
    "status": "confirmed",
    "worker_id": "uuid",
    "customer_id": "uuid"
  }
}
```

```json
// Error 403 — self-hire guard
{
  "success": false,
  "error": {
    "code": "SELF_ACTION_NOT_ALLOWED",
    "message": "You can't hire yourself."
  }
}
```

### `GET /hiring/:id/contact`

**Auth:** customer or worker involved in this hire

```json
// Response 200
{
  "success": true,
  "data": { "phone": "+251911223344", "telegram_username": "abebe_t" }
}
```

`phone` is `null` if the other party hasn't added one — frontend should always show whichever fields are non-null, not assume both exist.

---

## 6. Jobs & Applications

### `POST /jobs`

**Auth:** customer

```json
// Request
{
  "title": "Fix kitchen sink leak",
  "description": "Leaking under the sink for 2 days, needs urgent attention.",
  "category_id": "uuid",
  "budget": "800.00",
  "deadline": "2026-08-25"
}
```

```json
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "open",
    "title": "Fix kitchen sink leak",
    "created_at": "2026-08-17T09:00:00Z"
  }
}
```

### `GET /jobs/:id`

**Auth:** Public (full detail); if the requester is the owning customer, response also includes `applications` array

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Fix kitchen sink leak",
    "description": "Leaking under the sink for 2 days...",
    "category_name": "Plumbing",
    "budget": "800.00",
    "deadline": "2026-08-25",
    "status": "open",
    "customer_id": "uuid",
    "customer_name": "Sara A."
  }
}
```

### `POST /jobs/:jobId/applications`

**Auth:** worker

```json
// Request
{
  "proposed_price": "750.00",
  "estimated_completion_time": "Same day, within 3 hours"
}
```

```json
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "status": "pending",
    "proposed_price": "750.00"
  }
}
```

### `GET /jobs/:id/applications`

**Auth:** customer (must own the job)

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "worker_id": "uuid",
      "worker_name": "Abebe Tesfaye",
      "worker_rating_avg": 4.8,
      "worker_rating_count": 126,
      "proposed_price": "750.00",
      "estimated_completion_time": "Same day, within 3 hours",
      "status": "pending"
    }
  ]
}
```

### `POST /applications/:id/select`

**Auth:** customer (must own the parent job)

```json
// Response 200
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "job_status": "in_progress",
    "selected_application_id": "uuid"
  }
}
```

---

## 7. Payments (cash-functional; Telebirr/Chapa shapes reserved for Phase 2)

### `POST /payments`

**Auth:** customer

```json
// Request
{ "job_id": "uuid", "method": "cash", "amount": "750.00" }
```

```json
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "method": "cash",
    "amount": "750.00",
    "commission_rate": "0.1000",
    "commission_amount": "75.00",
    "status": "pending"
  }
}
```

`commission_rate` is read server-side from `platform_settings` — frontend never sends it. **Default value for the 5-day build: `0.10` (10%) — placeholder, confirm final rate with the team before demo day, business decision not a technical one.**

### `PATCH /payments/:id/mark-cash-paid`

**Auth:** customer

```json
// Response 200
{ "success": true, "data": { "id": "uuid", "status": "confirmed" } }
```

---

## 8. Reviews

### `POST /jobs/:jobId/reviews`

**Auth:** customer (job must be completed)

```json
// Request
{ "rating": 5, "comment": "Fast, professional, cleaned up after the job." }
```

```json
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "rating": 5,
    "comment": "Fast, professional, cleaned up after the job."
  }
}
```

Server recalculates the target worker's `rating_avg`/`rating_count` as a side effect — frontend should refetch the worker profile (or trust the invalidated TanStack Query cache) rather than compute the new average client-side.

---

## 9. Endpoints Not Yet Detailed Above

These exist (see `DATA_MODELS_AND_ENDPOINTS.md` for the full list and table schema) but weren't given full JSON examples here to keep this document buildable in the time available. **Whoever builds each one first should add its real request/response here before merging** — this is a case where the IDE agent implementing the route can propose the shape here as part of that PR, following the envelope/formatting rules in §1:

- `GET /categories`
- `GET /jobs/me` (customer's own posted jobs)
- `GET /workers/me/applications` (worker's own submitted applications)
- `DELETE /applications/:id` (withdraw)
- `GET /notifications`, `PATCH /notifications/:id/read`

## 10. Explicitly Deferred (do not build for the 5-day MVP)

Telebirr/Chapa live payment endpoints, business-account endpoints, admin endpoints, report endpoints, push notification device-token registration. Listed here so no one accidentally starts one mid-sprint — see `one-week-plan.md` scope cut list (business accounts + real gateways are Phase 2 regardless of the day count).
