# 02. Authentication & Authorization

## 1. Authentication Flow (Telegram OIDC)
The SRS requires secure JWT-based authentication (FR-004) and Phone Verification (FR-003). We are using Telegram OIDC.

**The Expected Auth Flow:**
1. **Login Trigger:** User clicks "Log in with Telegram" on the frontend.
2. **OIDC Callback:** Telegram redirects to the backend callback endpoint with user claims.
3. **Backend Identity Resolution:**
   - Backend checks if a `User` exists with the provided `telegramId`.
   - **If Existing User:** Generate a JWT session token and return to frontend.
   - **If New User:** Create a new `User` record in the database.
4. **The Phone Verification Gap:** 
   - The SRS states customers *must* register using a phone number (FR-002, FR-003). 
   - *Technical check:* If the Telegram OIDC payload does not include the user's phone number automatically (or if the user hides it), the backend MUST flag the account as `phoneVerified: false`. The frontend must intercept the login and force the user to input and verify their phone number via OTP before they can access the platform.

**Session Management:**
- Use an `HttpOnly` cookie containing the JWT to prevent XSS attacks.
- **Logout:** An endpoint that clears the HttpOnly cookie.
- **Expiration:** JWTs should have a reasonable expiration (e.g., 7 days) and force re-login, avoiding complex refresh token rotation for the 5-day MVP.

## 2. High-Level Authorization (System Roles)
The SRS mentions "Administrators" and "Regular users" (FR-15.4). 
We should strictly separate **System Authentication** from **Marketplace Roles**.

**System Roles (Defined on the User table):**
- `USER`: A standard authenticated human.
- `ADMIN`: Platform staff.

*Is this the correct model?* Yes. Do not put `CUSTOMER` or `WORKER` in the `role` enum on the User table. A human is a `USER`. How they interact with the platform is determined by their active profile.

## 3. Active-Role Architecture
A `USER` can have both a `CustomerProfile` and a `WorkerProfile`. 

**The Recommended Scalable Design:**
1. **User Identity:** `User { id, telegramId, phone, systemRole: 'USER' }`
2. **Context Profiles:** 
   - `CustomerProfile { id, userId, ... }`
   - `WorkerProfile { id, userId, ... }`
3. **Session Context:**
   - The JWT payload should contain: `{ userId, systemRole, customerProfileId, workerProfileId }`.
   - When the user uses the frontend, they select "Switch to Worker Mode". The frontend then includes a header: `X-Active-Role: WORKER` or routes to `/api/worker/...`.

**Why this is superior to `if (user.role === 'worker')`:**
- **Extensibility:** If you add `BUSINESS` or `MODERATOR` later, you just add a new profile table. The User table remains untouched.
- **Middleware:** You can write generic Express middleware like `requireProfile('WORKER')` that simply checks if `req.user.workerProfileId` exists and blocks access if it doesn't.
- **Reality:** Users often need to hire a plumber today, and offer tutoring services tomorrow. Locking an account to one role prevents this.
