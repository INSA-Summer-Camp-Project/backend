# 08. API Contract (Core Surface)

This is the high-level specification the frontend and backend must agree upon before writing code. All APIs return JSON.

## Standard Envelopes
**Success:** `{ "success": true, "data": { ... } }`
**Error:** `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

## 1. Auth & Profiles
**GET /api/auth/me**
- Auth: Required
- Returns the current user and their active profiles.
- Response: `{ id, name, phone, customerProfile: { id }, workerProfile: { id } }`

**POST /api/profiles/worker**
- Auth: Required
- Purpose: Upgrades a User to a Worker.
- Body: `{ bio, isBusiness, categoryIds: [...] }`

---

## 2. Jobs (Service Requests)
**POST /api/jobs**
- Auth: Required (Customer Context)
- Body: `{ title, description, categoryId, budget }`
- Response: `201 Created`, Job object.

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

## 4. Execution & Review
**POST /api/jobs/:jobId/complete**
- Auth: Required (Worker Context)
- Marks job ready for payment/review.

**POST /api/jobs/:jobId/reviews**
- Auth: Required (Customer Context)
- Body: `{ rating: 5, comment: "Great job" }`
- Logic: Updates Worker's average rating.
