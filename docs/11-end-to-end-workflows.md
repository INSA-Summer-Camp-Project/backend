# 11. End-to-End Workflows

These are the exact sequences of actions required to complete the core business loops.

## Workflow 1: The Job Marketplace (P0)
This is the core engine of ServiceHub.
1. **Post:** Customer navigates to `/customer/jobs/new`. Fills out title, budget (e.g., 1000 ETB), and selects category "Plumbing".
2. **Database:** `Job` created with `status: OPEN`.
3. **Discovery:** Worker (Plumber) logs in, navigates to `/worker/jobs`. Queries `GET /api/jobs/public?categoryId=Plumbing`. Sees the job.
4. **Bid:** Worker clicks "Apply". Enters proposed price: 1200 ETB, Time: 2 hrs.
5. **Database:** `Application` created with `status: PENDING`.
6. **Selection:** Customer goes to Job Details. Sees Application. Clicks "Accept".
7. **Database Transaction:** 
   - Accepted `Application` -> `ACCEPTED`.
   - All other Applications on this Job -> `REJECTED`.
   - `Job` -> `ASSIGNED`. `assignedWorkerId` = Worker.
8. **Execution:** Customer and Worker communicate. Service happens in real life.
9. **Payment:** Customer clicks "Pay via Chapa". (See Document 10).
10. **Review:** Customer is prompted to leave 1-5 stars. Average rating on Worker profile is recalculated.

## Workflow 2: Direct Hire (P1)
1. **Search:** Customer goes to `/search`. Filters by "Plumber".
2. **Profile:** Customer views Worker Profile. 
3. **Hire:** Customer clicks "Hire Me". 
4. **System divergence:** Instead of an open job, the frontend prompts the customer to describe the task and immediately calls `POST /api/jobs` but includes `assignedWorkerId: [id]`.
5. **Database:** `Job` created with `status: ASSIGNED` instantly. No applications needed.
6. **Execution & Payment:** Follows steps 8-10 above.

## Workflow 3: Authentication & Role Selection (P0)
1. User clicks "Login with Telegram".
2. Telegram OIDC returns `{ telegramId: "123", first_name: "Abebe" }`.
3. Backend creates `User`. Returns JWT.
4. Frontend routes to `/onboarding/role`. User selects "I want to offer services".
5. Backend creates `WorkerProfile`.
6. Frontend routes to `/worker/dashboard`.
