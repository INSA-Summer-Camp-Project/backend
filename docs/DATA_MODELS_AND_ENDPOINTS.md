# ServiceHub — Data Models & Endpoints (Telegram Auth + Dual Profiles)

This supersedes the **Auth**, **Users**, and session-related parts of `ServiceHub_Data_Models_and_API_Reference.md`. Everything else in that document (jobs, applications, payments, reviews, etc.) is unchanged — only identity/session handling and its endpoints are new. See `AUTH_FLOW.md` for the narrative version of how these pieces fit together.

---

## 1. Changed Table: `users`

| Column             | Type                       | Constraints          | Change                                                               |
| ------------------ | -------------------------- | -------------------- | -------------------------------------------------------------------- |
| id                 | uuid                       | PK                   | —                                                                    |
| telegram_id        | bigint                     | **unique, not null** | **new** — Telegram's numeric user ID, the real identity anchor       |
| telegram_username  | varchar(64)                | nullable             | was already present, now populated at login instead of set manually  |
| telegram_photo_url | varchar(255)               | nullable             | **new**                                                              |
| name               | varchar(120)               | not null             | now sourced from Telegram first/last name, editable after            |
| phone              | varchar(20)                | **unique, nullable** | **changed from required to optional** — Telegram doesn't provide it  |
| phone_verified     | boolean                    | default false        | kept for later, only relevant if/when phone is added                 |
| email              | varchar(160)               | unique, nullable     | unchanged                                                            |
| ~~password_hash~~  | —                          | —                    | **removed** — no password auth                                       |
| is_admin           | boolean                    | default false        | **new** — staff flag, independent of customer/worker profiles        |
| last_active_role   | enum('customer','worker')  | nullable             | **new** — remembers which dashboard to land on next login            |
| status             | enum('active','suspended') | default 'active'     | simplified — `pending_verification` no longer needed without SMS OTP |
| created_at         | timestamp                  | default now()        | —                                                                    |
| updated_at         | timestamp                  | default now()        | —                                                                    |

**Note:** `role` was never a column on `users` in the current design — `customers`/`workers` (unchanged, see below) are the source of truth for which profiles a person has activated. A user may have a row in neither, either, or both.

---

## 2. New Table: `refresh_tokens`

| Column      | Type         | Constraints                                                       |
| ----------- | ------------ | ----------------------------------------------------------------- |
| id          | uuid         | PK                                                                |
| user_id     | uuid         | FK → users.id                                                     |
| token_hash  | varchar(255) | not null — never store raw tokens                                 |
| device_info | varchar(255) | nullable — user agent / platform, for "log out of all devices" UX |
| expires_at  | timestamp    | not null                                                          |
| revoked_at  | timestamp    | nullable                                                          |
| created_at  | timestamp    | default now()                                                     |

Rotated on every `/auth/refresh` call (old row's `revoked_at` set, new row created). A presented token that's already revoked is treated as a possible theft signal — revoke all tokens for that `user_id`.

---

## 3. Unchanged, but worth restating: `customers` / `workers`

```
customers:  id PK, user_id FK (unique), address, created_at
workers:    id PK, user_id FK (unique), bio, experience_years, profile_photo_url,
            payment_rate, pricing_type, availability, rating_avg, rating_count, created_at
```

`user_id` is `unique` **within each table** (one customer profile per user, one worker profile per user) — but nothing stops the _same_ `user_id` from having a row in both tables simultaneously. That's what makes dual-role possible: it's just two independent optional child records off one `users` row.

---

## 4. Endpoints — Auth (replaces the old `/auth/*` block)

All prefixed `/api/v1`.

| Method | Path                         | Description                                                                         | Auth                           |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| POST   | /auth/telegram/callback      | Verify Telegram widget payload; login or create user; issue access + refresh tokens | Public                         |
| POST   | /auth/onboarding/select-role | First-time role choice (`customer` or `worker`); creates that profile               | User (active_role may be null) |
| POST   | /auth/switch-role            | Reissue access token for a role the user already holds                              | User                           |
| POST   | /auth/become-worker          | Create a `workers` profile for the current user at any time                         | User                           |
| POST   | /auth/become-customer        | Create a `customers` profile for the current user at any time                       | User                           |
| POST   | /auth/refresh                | Exchange a valid refresh token for a new access + refresh token pair                | Refresh token                  |
| POST   | /auth/logout                 | Revoke the current refresh token                                                    | User                           |
| POST   | /auth/logout-all             | Revoke all refresh tokens for the user                                              | User                           |
| GET    | /auth/me                     | Return `{ user, profiles[], active_role, last_active_role }`                        | User                           |

**Removed** (no longer applicable): `POST /auth/register`, `POST /auth/verify-phone`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` — all were password/SMS-OTP specific.

---

## 5. Endpoints — Everything Else

Unchanged from `ServiceHub_Data_Models_and_API_Reference.md` (`/users`, `/customers`, `/workers`, `/businesses`, `/services`, `/categories`, `/search`, `/jobs`, `/applications`, `/hiring`, `/payments`, `/reviews`, `/notifications`, `/reports`, `/admin`) — only their **auth requirements** shift slightly:

- Any endpoint previously marked `Customer` or `Worker` now means: _authenticated request where the token's `active_role` matches_, enforced via the `requireRole()` middleware described in `AUTH_FLOW.md` §4 — not a fixed account type.
- Endpoints that act on a specific record (editing a job, updating a worker profile, etc.) also run `requireOwnership()` — role match alone isn't sufficient.
- `Admin`-marked endpoints now check `users.is_admin`, independent of `active_role`.

---

## 6. Migration Note (if any old-scheme data/mock users exist)

If placeholder users were seeded under the old phone/password scheme during earlier setup:

1. Drop `password_hash`.
2. Add `telegram_id` as nullable first, backfill or discard test rows, then tighten to `not null unique`.
3. Make `phone` nullable; keep existing values, don't require re-collection.
4. Add `is_admin`, `last_active_role`, `telegram_photo_url` with sensible defaults.
