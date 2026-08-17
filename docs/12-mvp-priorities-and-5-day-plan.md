# 12. MVP Priorities and 5-Day Plan

With only 5 days, ruthless prioritization is required.

## Priority Classification
- **P0 (Must Have):** Without this, the demo fails completely.
- **P1 (Should Have):** Makes the demo look like a real product.
- **P2 (Skip for MVP):** Mentioned in SRS, but too complex or time-consuming. 

## The 5-Day Development Plan

### Day 1: Foundation & Identity (P0)
- **Backend:** Setup DB schema (Prisma). Telegram OIDC integration.
- **Frontend:** Next.js setup. Login UI. Role selection screen (`/onboarding/role`). API Client setup with interceptors.
- **Checkpoint:** A user can log in via Telegram, pick "Customer" or "Worker", and land on an empty dashboard.

### Day 2: The Job Engine (P0)
- **Backend:** CRUD endpoints for `Jobs` and `WorkerProfiles`. Seed `ServiceCategories` into DB.
- **Frontend:** Customer "Post a Job" form. Worker "Job Board" feed. Worker Profile edit screen (bio, skills).
- **Checkpoint:** Customer can post a job, Worker can see it on their feed.

### Day 3: Bidding & Matching (P0)
- **Backend:** `Application` endpoints. The complex "Accept Application" transaction (updating job status, rejecting others).
- **Frontend:** Worker clicks job and submits Application. Customer sees Applications and clicks "Accept".
- **Checkpoint:** The core marketplace loop is complete. Jobs move from `OPEN` to `ASSIGNED`.

### Day 4: Execution & Chapa (P0/P1)
- **Backend:** Chapa integration (Initialize + Webhook). Ratings logic.
- **Frontend:** Payment checkout button. Rating form.
- **Checkpoint:** Customer can pay and rate. Job moves to `COMPLETED`.

### Day 5: Polish & Edge Cases
- **Frontend & Backend:** Fix routing bugs. Ensure empty states look good ("No jobs available"). Error handling (Toast notifications).
- **Admin:** If time permits, create a simple `/admin` screen to view metrics.
- **Demo Prep:** Seed the database with fake workers and jobs so the demo looks populated.
