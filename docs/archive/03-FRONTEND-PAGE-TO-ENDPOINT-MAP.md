# ServiceHub — Frontend Page → Endpoint Map

Purpose: so a frontend developer can start a page **the moment its endpoints are frozen in `02-API-CONTRACT.md`**, without needing to ask backend "what do I call here" — and so backend knows, page by page, what's actually depending on each endpoint they're about to build.

Scope: MVP pages only, matching `one-week-plan.md`'s in-scope feature list. Visual spec for each page is in `DESIGN.md` §16.

Format per page: **route → endpoints called → key client state needed (TanStack Query vs Zustand, per the earlier decision to keep server data out of Zustand)**.

---

## Auth & Onboarding

### `/login`

- Calls: `POST /auth/telegram/callback`
- State: on success, store `access_token`/`refresh_token` (secure storage per platform), route based on `data.profiles`.

### `/onboarding`

- Shown when `profiles: []` after login.
- Calls: `POST /auth/onboarding/select-role`
- State: none persisted beyond the auth store update after the call.

### Global: role switcher (nav component, not a standalone page)

- Calls: `POST /auth/switch-role`, `POST /auth/become-worker` / `become-customer`
- State: `active_role` lives in the Zustand auth store (small, client-only, mirrors the current access token's claim) — not TanStack Query, since it's not "fetched data," it's session state.

---

## Customer-Facing Pages

### `/` (landing / search entry)

- Calls: `GET /categories`, `GET /search/providers` (default/featured query)
- State: TanStack Query for both; search filters (category, rating, sort) held in local component/URL state, not global.

### `/search` (results)

- Calls: `GET /search/providers?category=&rating_min=&sort=&page=`
- State: TanStack Query, keyed on the filter params so changing a filter triggers a refetch/cache-hit correctly. Keep filters in the URL query string (shareable, back-button friendly) rather than only in memory.

### `/workers/:id` (public profile)

- Calls: `GET /workers/:id`
- Also renders a "Hire" button → triggers `/hiring/direct-hire` (see below).

### `/jobs/new` (post a job)

- Calls: `POST /jobs`
- State: local form state; on success, invalidate the customer's job list query and redirect to `/jobs/:id`.

### `/jobs/:id` (customer's own job — application comparison)

- Calls: `GET /jobs/:id` (as owner, includes applications), `POST /applications/:id/select`
- State: TanStack Query; selecting an applicant should optimistically update status before the refetch confirms, since this is a moment users will click and expect instant feedback.

### `/dashboard/customer` (active jobs, hires, notifications)

- Calls: `GET /jobs/me`, `GET /notifications`
- State: TanStack Query for both, polled or refetched on focus rather than real-time (no websockets in MVP scope).

### `/hire/:hireId/contact` (post direct-hire confirmation)

- Calls: `GET /hiring/:id/contact`

### `/payments/:jobId` (payment screen)

- Calls: `POST /payments`, `PATCH /payments/:id/mark-cash-paid`
- Telebirr/Chapa buttons render **disabled** with a "coming soon" state per the deferred-scope decision — don't wire them to real endpoints, they don't exist yet.

### `/jobs/:jobId/review` (post-completion review form)

- Calls: `POST /jobs/:jobId/reviews`
- State: on success, invalidate the relevant `GET /workers/:id` query so the profile page reflects the new rating without a manual refresh if the user navigates back.

---

## Worker-Facing Pages

### `/dashboard/worker` (available jobs, my applications, active jobs)

- Calls: `GET /search/jobs?status=open`, `GET /workers/me/applications`
- State: TanStack Query, two independent queries — don't merge into one call.

### `/profile/edit` (worker profile form)

- Calls: `PATCH /workers/me`, `GET /categories` (to populate the service/category picker)
- State: form state local; on success, invalidate `GET /workers/:id` (own profile) so any other open tab/view reflects it.

### `/jobs/:jobId/apply` (application form)

- Calls: `POST /jobs/:jobId/applications`
- State: local form; on success, redirect to `/dashboard/worker` and invalidate the applications list query.

---

## Shared / Cross-Role

### Notification bell (component, appears on both dashboards)

- Calls: `GET /notifications`, `PATCH /notifications/:id/read`
- State: TanStack Query, refetch on interval (e.g. every 30s) — acceptable substitute for push notifications within the MVP's deferred-scope decision.

### Empty/error states

- No dedicated endpoints — these are UI states triggered by an empty `data: []` array or a caught error envelope (see `02-API-CONTRACT.md` §1). Every list-rendering page above must handle both cases explicitly; see `DESIGN.md` §15 for the specific copy/layout per state.

---

## Explicitly Not Pages in This Sprint

Business dashboard/profile, admin panel, report screens, chat/messaging UI (replaced by the contact-reveal screen above) — all deferred per `one-week-plan.md`. Don't scaffold routes for these yet; adding empty routes now just creates dead code someone has to remember to either finish or delete later.
