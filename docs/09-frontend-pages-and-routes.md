# 09. Frontend Pages and Routes

This defines the page inventory for the Next.js web application.

## 1. Public Pages

- **`/` (Landing Page):** Value proposition, Hero section, Categories list. (P1)
- **`/login`:** "Login with Telegram" button. (P0)
- **`/search`:** Public directory of workers and categories. (P0)
- **`/worker/:id`:** Public view of a worker's profile, portfolio, and reviews. (P0)

## 2. Shared Authenticated Routes

- **`/onboarding/role`:** "Do you want to hire someone or offer services?" (Creates Customer or Worker profile). (P0)

## 3. Customer Routes (Protected: Customer Profile Required)

- **`/customer/dashboard`:** Active jobs, pending posts. (P0)
- **`/customer/jobs/new`:** Form to post a new job. (P0)
- **`/customer/jobs/[id]`:** Detailed view of their job. Includes a list of **Applications** where they can click "Accept" on a worker. (P0)
- **`/customer/checkout/[jobId]`:** Chapa payment UI. (P0)

## 4. Worker Routes (Protected: Worker Profile Required)

- **`/worker/dashboard`:** Active jobs they've won, earnings. (P0)
- **`/worker/jobs`:** The "Job Board" where they browse open customer requests. (P0)
- **`/worker/jobs/[id]`:** Job details with an "Apply/Bid" form for price and time. (P0)
- **`/worker/profile`:** Form to edit bio, add portfolio images, set categories. (P1)

## 5. Admin Routes (Protected: Admin Role Required)

- **`/admin`:** Dashboard. (P2 - Do last)
- **`/admin/categories`:** Category management. (P2 - Seed DB instead for MVP)
