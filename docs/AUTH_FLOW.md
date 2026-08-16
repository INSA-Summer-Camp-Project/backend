# ServiceHub — Authentication & Authorization Flow

This describes how identity, login, and role-switching work now that **Telegram is the sole login method** and a single person can hold **both a customer profile and a worker profile** on one account.

Companion to `DATA_MODELS_AND_ENDPOINTS.md` (schema + full endpoint list) and `DESIGN.md` (screens for onboarding/role-switch UI).

---

## 1. Core Concept

Two ideas drive everything below:

1. **Identity ≠ Role.** `users` is _who you are_ (one row per person, tied to a Telegram account). `customers` and `workers` are _profiles you've activated_ — a person can have neither yet, one, or both, at the same time. There is no `role` column on `users`.
2. **A token always carries one active role**, but the user can hold multiple. Switching roles reissues a token — it does not require logging out.

---

## 2. Identity: Login via Telegram

We use [Telegram's Login Widget](https://core.telegram.org/widgets/login) — no password, no SMS OTP provider needed.

### 2.1 What Telegram gives us

When a user authenticates through the widget, Telegram redirects back (or calls our callback) with:

```
id, first_name, last_name, username, photo_url, auth_date, hash
```

`hash` is an HMAC-SHA-256 signature over the other fields, keyed with a hash of our bot token. **We must verify this signature server-side before trusting any of the payload** — this is the only thing standing between us and someone spoofing a Telegram identity.

### 2.2 Login sequence

```
1. User clicks "Continue with Telegram" (web widget / bot deep-link on mobile)
2. Telegram returns signed payload → our backend
3. Backend verifies HMAC signature against bot token
   → invalid signature: reject, 401
4. Backend looks up users.telegram_id
   a. Found  → this is a returning user
   b. Not found → create a new `users` row (telegram_id, telegram_username,
      name from first/last name, telegram_photo_url). profiles = []
5. Backend issues:
   - access token  (short-lived JWT, ~15 min)
   - refresh token (long-lived, ~30 days, stored hashed in `refresh_tokens`)
6. Response includes: { access_token, refresh_token, profiles: [...],
   last_active_role: "customer" | "worker" | null }
```

### 2.3 Token payload

```json
{
  "user_id": "uuid",
  "active_role": "customer" | "worker" | null,
  "profiles": ["customer"] | ["worker"] | ["customer","worker"] | [],
  "iat": ...,
  "exp": ...
}
```

`active_role` is `null` only in the brief window between first login and completing onboarding (Section 3). Every authenticated request after that carries a concrete `active_role`.

### 2.4 Phone number

Telegram does not hand us a phone number by default. `users.phone` is therefore **optional**, collected later if/when needed (e.g. a worker who wants it shown for direct calls, or for a future SMS-based feature). This supersedes the earlier SRS requirement that customers register with a phone number — Telegram identity replaces that role.

---

## 3. Onboarding: First Login

A brand-new user (`profiles: []`) is shown a single choice before reaching any dashboard:

> **"How do you want to start?"**
> — I need to hire someone → creates a `customers` row
> — I provide a service → creates a `workers` row

```
POST /auth/onboarding/select-role   { role: "customer" | "worker" }
  → creates the corresponding profile row
  → reissues access token with active_role set + updated profiles[]
  → sets users.last_active_role for next time
```

This is the **only** forced choice in the whole flow. It does not lock the user out of the other role later — see Section 5.

---

## 4. Authorization: Enforcing Role on Requests

Standard JWT bearer auth. Middleware, in order:

1. **`authenticate`** — verifies signature/expiry of the access token, attaches `req.user = { user_id, active_role, profiles }`.
2. **`requireRole(role)`** — rejects (403) if `req.user.active_role !== role`. Used on role-specific routes, e.g. `POST /jobs` requires `active_role === "customer"`, `POST /applications` requires `active_role === "worker"`.
3. **`requireOwnership(resource)`** — for routes acting on a specific record (e.g. editing a job, updating a worker profile), confirms the record's owning `user_id` matches `req.user.user_id`. Role-correctness alone isn't enough — a customer must only edit _their own_ jobs.
4. **`requireAdmin`** — separate check against a distinct `is_admin` flag on `users` (admins are staff, not a marketplace "role" a regular user picks — see Section 7).

**Important:** because `active_role` lives in the _token_, not a live DB lookup, authorization is fast (no extra query per request) but means a role switch only takes effect on the _next_ token — which is exactly why switching reissues a token immediately rather than lazily.

### 4.1 Self-action guard

Since one person can hold both profiles, add an explicit check wherever a customer and a provider interact:

- A user cannot submit an `application` to a `job` they posted themselves.
- A user cannot be selected as their own hire.
  Check: `job.customer.user_id !== applicant.user_id` (via the `workers`/`businesses` profile's `user_id`, not the profile id).

---

## 5. Switching Roles (No Logout Required)

This is the core change from the original plan. Instead of forcing logout/login to switch, we use the **existing refresh token** to silently mint a new access token with a different `active_role`.

```
POST /auth/switch-role   { role: "customer" | "worker" }
Authorization: Bearer <refresh_token belongs to this session>

  → 400 if the user doesn't have that profile yet (see Section 6 to create one)
  → otherwise: issue new access token with active_role = requested role
  → update users.last_active_role
  → response: { access_token }
```

**UI behavior:** if `profiles.length === 1`, don't show a switcher at all — go straight to that dashboard. If `profiles.length === 2`, show a small persistent switcher (e.g. top-nav dropdown: "Customer view / Worker view"), and calling this endpoint on selection should feel instant — no page reload, no re-auth prompt.

### 5.1 Why not force logout/login instead

It's a valid, simpler-to-build alternative, but it means running two fully separate sessions for one person and adds real friction for exactly the users most valuable to the marketplace — the ones acting as both customer and provider. Silent reissue keeps the same backend simplicity (one clear role per token) without that cost.

---

## 6. Acquiring the Second Role Later

A user with only one profile can add the other **at any time**, not just at onboarding — e.g. a "Also offer services on ServiceHub →" prompt on the customer dashboard.

```
POST /auth/become-worker      (requires active session, any active_role)
POST /auth/become-customer

  → creates the corresponding profile row if it doesn't already exist
  → reissues access token: active_role = the newly created role,
    profiles[] now includes both
```

After this, `POST /auth/switch-role` works between both roles going forward.

---

## 7. Session Lifecycle

| Endpoint                                       | Purpose                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /auth/telegram/callback`                 | Verify Telegram payload, login or create user, issue tokens                                     |
| `POST /auth/onboarding/select-role`            | First-time role choice → creates profile, sets active_role                                      |
| `POST /auth/switch-role`                       | Reissue access token with a different (already-held) active_role                                |
| `POST /auth/become-worker` / `become-customer` | Create the second profile at any point                                                          |
| `POST /auth/refresh`                           | Exchange a valid refresh token for a new access token (same active_role, rotates refresh token) |
| `POST /auth/logout`                            | Revoke the current refresh token (`refresh_tokens.revoked_at`)                                  |
| `POST /auth/logout-all`                        | Revoke all refresh tokens for the user (e.g. "log out of all devices")                          |

**Refresh token rotation:** every `/auth/refresh` call issues a new refresh token and invalidates the old one (stored hashed, single-use). If a revoked/already-used refresh token is presented, treat it as a signal of possible token theft and revoke the entire token family for that user.

---

## 8. Admin Access

Admins are **not** a third "role" a user switches into via Section 5 — they're staff accounts. `users.is_admin: boolean`, checked independently of `active_role`/`profiles`. An admin account may also separately hold a customer/worker profile like anyone else, but admin-only routes check `is_admin`, not `active_role`.

---

## 9. Sequence Summary (end to end)

```
New user
  → Telegram login → user created, profiles=[]
  → Onboarding: picks "customer" → customers row created, active_role="customer"
  → Browses, hires a worker

Same user, later
  → Logs in via Telegram again (same telegram_id → same users row)
  → profiles=["customer"], last_active_role="customer" → straight to customer dashboard
  → Clicks "Also offer services" → POST /auth/become-worker
  → profiles=["customer","worker"], active_role="worker" → worker onboarding (profile fields)

Same user, another day
  → Logs in → profiles=["customer","worker"] → sees role switcher
  → Currently in worker view, wants to hire someone
  → POST /auth/switch-role {role:"customer"} → new access token, no logout, instant
```
