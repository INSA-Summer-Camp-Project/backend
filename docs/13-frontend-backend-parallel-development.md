# 13. Frontend/Backend Parallel Development

To succeed in 5 days, frontend cannot wait for backend endpoints to be finished.

## Parallelization Strategy

### 1. Shared Contract (The Enabler)
The API documentation (e.g., `02-API-CONTRACT.md` or this folder) is the source of truth. Both teams agree on the JSON shapes today.

### 2. Frontend Work (MSW)
The frontend team uses **Mock Service Worker (MSW)**. 
- They intercept network requests to `/api/jobs` and return hardcoded JSON arrays that exactly match the agreed contract.
- They build the entire UI (forms, lists, loading states, error handling) against this mock.

### 3. Backend Work (Postman)
The backend team builds controllers and Prisma queries.
- They test their endpoints exclusively using Postman or unit tests to ensure they return the exact JSON shape specified in the contract.

### 4. The Integration Checkpoint
When backend finishes `/api/jobs`, the frontend turns off MSW for that route and points the API client to the real `localhost:3000`. 
- Because both built to the exact same contract, the UI should populate perfectly with real data on the first try.

## What Must Be Agreed On TODAY
Before anyone writes code, the team must agree on:
1. **JSON casing:** `camelCase` (e.g., `proposedPrice`), NOT `snake_case`.
2. **Date format:** Always ISO 8601 strings in UTC.
3. **IDs:** UUIDs everywhere.
4. **Auth Transport:** Will the JWT be in an `HttpOnly` cookie or a `Bearer` header? (We agreed on HttpOnly cookies previously).
