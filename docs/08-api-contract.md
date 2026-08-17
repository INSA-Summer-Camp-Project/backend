# 08. API Contract (Core Surface)

This is the high-level specification the frontend and backend must agree upon before writing code. All APIs return JSON.

## Standard Envelopes

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
- Money: **decimal string**, not a float — `"500.00"`, not `500.0`. Applies to `budget`, `proposedPrice`, `amount`.

---

## 1. Auth & Profiles
**GET /api/auth/me**
- Auth: Required
- Returns the current user and their active profiles.
- Response: `{ id, name, lastActiveRole, customerProfile: { id }, workerProfile: { id } }`

**PUT /api/auth/role**
- Auth: Required
- Body: `{ activeRole: "CUSTOMER" | "WORKER" }`
- Logic: Updates `lastActiveRole` on the User table.

**POST /api/profiles/worker**
- Auth: Required
- Purpose: Upgrades a User to a Worker.
- Body: `{ bio, categoryIds: [...] }`

**PUT /api/profiles/worker**
- Auth: Required (Worker Context)
- Purpose: Updates existing bio, baseRate, or skills.
- Body: `{ bio, baseRate, categoryIds: [...] }`

**GET /api/upload/signature**
- Auth: Required
- Returns: `{ signature, timestamp, apiKey, cloudName }` for frontend direct-upload.

**POST /api/profiles/worker/portfolio**
- Auth: Required (Worker Context)
- Body: `{ title, description, imageUrl, imagePublicId }` (After frontend direct-upload)
- Response: `201 Created`

**POST /api/profiles/worker/certificates**
- Auth: Required (Worker Context)
- Body: `{ title, fileUrl, filePublicId }` (After frontend direct-upload)
- Response: `201 Created`

---

## 2. Discovery & Shared Resources
**GET /api/categories**
- Auth: Optional
- Returns: List of all Service Categories for frontend dropdowns.

**GET /api/workers**
- Auth: Optional/Required
- Query: `?categoryId=123`
- Returns: List of workers for Direct Hire browsing.

**GET /api/workers/:id**
- Returns: Detailed profile, portfolio items, certificates, and reviews for a worker. The worker profile response object includes `verifiedJobCount` and `verifiedEarningsTotal`.

---

## 3. Jobs (Service Requests)
**GET /api/customer/jobs**
- Auth: Required (Customer Context)
- Returns: All jobs posted by this customer (Dashboard view).

**GET /api/worker/jobs**
- Auth: Required (Worker Context)
- Returns: All active jobs assigned to this worker.
**POST /api/jobs**
- Auth: Required (Customer Context)
- Body: `{ title, description, categoryId, budget, targetWorkerId? }`
- Response: `201 Created`, Job object. (If targetWorkerId is present, job is DIRECT_HIRE).

**GET /api/jobs/public**
- Auth: Optional/Required
- Query: `?categoryId=123`
- Returns: List of `OPEN` jobs for workers to browse.

**GET /api/jobs/:id**
- Returns Job details. If requester is the Job owner, includes nested `Applications`.

---

## 3. Applications (Bids)
**POST /api/jobs/:jobId/applications**
- Auth: Required (Worker Context)
- Body: `{ proposedPrice, estimatedTime }`
- Response: `201 Created`

**POST /api/jobs/:jobId/applications/:appId/accept**
- Auth: Required (Customer Context - Must own the Job)
- Logic: Updates Application to `ACCEPTED`, Job to `ASSIGNED`, sets `Job.assignedWorkerId`. Rejects all other apps.

---

**POST /api/jobs/:jobId/status**
- Auth: Required
- Body: `{ status: "COMPLETED" | "CANCELLED" }`
- Logic: Customer or Worker can mark job complete based on business rules.

---

## 5. Payments & Reviews

**POST /api/payments/initialize**
- Auth: Required (Customer Context)
- Body: `{ jobId: "..." }`
- Returns: `{ checkoutUrl: "https://checkout.chapa.co/...", txRef: "..." }`

**POST /api/webhooks/chapa**
- Auth: Chapa Signature Validation
- Body: Chapa event payload
- Logic: Verifies signature, finds Payment by `txRef`, updates Payment and Job status. (Note: Confirming a payment increments the assigned worker's `verifiedJobCount` and `verifiedEarningsTotal`).

**POST /api/jobs/:jobId/reviews**
- Auth: Required (Customer Context)
- Body: `{ rating: 5, comment: "Great job" }`
- Logic: Updates Worker's average rating.
