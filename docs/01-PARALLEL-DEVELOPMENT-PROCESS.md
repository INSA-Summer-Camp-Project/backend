# ServiceHub — Parallel Development Process

**Purpose of this document:** with 5 days and frontend/backend building simultaneously, the biggest risk isn't either team's individual speed — it's **drift**: the two sides silently disagreeing about what an endpoint returns, what a field is called, or what a status code means, and only discovering it at integration. This document exists to make that drift structurally hard, not just something we try to avoid by being careful.

Read alongside `02-API-CONTRACT.md` (the frozen interface) and `03-FRONTEND-PAGE-TO-ENDPOINT-MAP.md` (what each screen needs).

---

## 1. The Core Rule: Contract-First, Not Code-First

**No one writes implementation code against an endpoint until that endpoint exists in `02-API-CONTRACT.md` with its exact request and response shape.**

This means, in order, for any new endpoint:

1. Someone drafts the shape in `02-API-CONTRACT.md` (a PR, not a Slack message).
2. Both a backend person and a frontend person look at it — specifically checking "does this give the frontend everything it needs to render without a second request, and does this match what the backend can produce without excessive joins."
3. Once merged, it's **frozen**. Backend builds to it. Frontend builds against a mock of it (Section 3). Neither side needs to wait for the other's actual code.
4. If reality forces a change mid-build (it will, at least once), that change follows the process in Section 4 — it never happens silently in one side's codebase.

This is what makes true parallelism possible: frontend isn't blocked waiting for backend to finish an endpoint, because frontend was never waiting on backend's _code_ — only on the _contract_, which existed on day 1.

---

## 2. Team Split & Ownership

_(Fill in actual names — structure below assumes a small team; adjust if your split differs.)_

| Area                                | Owner                                 | Responsibility                                                                        |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| API Contract                        | [Both leads agree; one person merges] | Final say on any contract change                                                      |
| Auth (Telegram, roles, tokens)      | [TBD]                                 | Backend: implement per `AUTH_FLOW.md`. Frontend: login/onboarding/role-switch screens |
| Worker/Search                       | [TBD]                                 |                                                                                       |
| Job marketplace (post/apply/select) | [TBD]                                 |                                                                                       |
| Payments (cash only)                | [TBD]                                 |                                                                                       |
| Reviews                             | [TBD]                                 |                                                                                       |

Given the 5-day timeline, prefer **one backend + one frontend person per vertical slice** (see the one-week plan) working the same slice simultaneously, rather than "all backend people on the API, all frontend people on the UI." This keeps each pair tightly scoped to one contract surface at a time and avoids the whole team blocking on one shared endpoint file.

---

## 3. How Frontend Builds Without Waiting for Backend

Frontend does **not** wait for a real backend to exist. As soon as an endpoint is frozen in the contract:

- Stand up a mock server from the contract (recommended: **MSW — Mock Service Worker** for Next.js, or a lightweight `json-server`/Express stub) that returns the exact example responses in `02-API-CONTRACT.md`.
- Build the real UI against the mock — same TanStack Query hooks, same Zustand state, same loading/error handling you'd use against the real API.
- When backend's real endpoint is ready, **swap the base URL only.** If the contract was followed on both sides, nothing else in frontend code should need to change.

This is the actual point of freezing the contract early — it converts "frontend is blocked on backend" into "frontend and backend are both blocked on the same three-line JSON shape being agreed, once, on day 1 of that slice."

---

## 4. Changing the Contract Mid-Build

Something will need to change — that's normal, not a failure. What matters is that it happens visibly:

1. Whoever hits the need (usually frontend discovering a missing field, or backend discovering a shape that's expensive to produce) posts the proposed change **in writing** (PR to `02-API-CONTRACT.md`, or the team's designated channel) before changing any code.
2. The other side acknowledges before implementation starts on either end.
3. Update the contract doc in the same PR/commit as the change — the doc must never lag behind reality. A contract doc that's known to be stale is worse than no doc, because people stop trusting it.

Given the timeline, don't over-process this — a 2-minute Slack thread with an explicit "agreed, updating the doc now" is enough. The point isn't ceremony, it's that **both sides always know the current shape**, not that they went through a formal review board.

---

## 5. Standards Both Sides Must Follow (No Exceptions)

These are covered in detail with examples in `02-API-CONTRACT.md` §1–2, listed here as the checklist:

- Every response uses the standard success/error envelope — no endpoint returns a bare array or bare object.
- Every error uses the standard error shape with a `code`, not just an HTTP status — frontend needs stable error codes to branch UI logic on, not string-matching a message.
- Dates are ISO 8601 strings. Money is a decimal string (`"500.00"`), never a float, to avoid rounding bugs — especially relevant given payments/commission math.
- IDs are UUID strings everywhere, including in URLs.
- `Authorization: Bearer <access_token>` on every authenticated request — no custom header schemes per endpoint.

---

## 6. Daily Sync (given the 5-day window)

With this little time, a short daily check-in matters more than usual — misalignment compounds fast over 5 days.

- **Start of each day (10 min):** confirm which slice both sides are building today, confirm its contract section is frozen before anyone starts coding against it.
- **End of each day (10–15 min):** whoever finished a slice demos it — frontend against its mock, backend against Postman/its own test — even before the two are wired together. Catches shape mismatches within hours, not on integration day.
- **Integration checkpoints:** don't save all wiring-together for the last day. Swap frontend from mock → real backend for each slice as soon as that slice's backend is done, not in a batch at the end. This is the single biggest thing that prevents a chaotic final day.

---

## 7. Definition of Done (per slice, both sides)

A slice isn't "done" when the code is written — it's done when:

- [ ] Contract entry exists and matches what was actually built (not what was planned).
- [ ] Backend endpoint tested directly (Postman/curl) against the contract's example request/response.
- [ ] Frontend screen works against the mock.
- [ ] Frontend screen re-tested against the **real** backend endpoint, not just the mock.
- [ ] Auth/role checks verified (a customer-only endpoint actually rejects a worker token, etc.).
- [ ] Errors render sensibly in the UI, not just the happy path.

---

## 8. What Goes Where in `docs/`

```
docs/
  01-PARALLEL-DEVELOPMENT-PROCESS.md   ← this file
  02-API-CONTRACT.md                   ← frozen request/response shapes
  03-FRONTEND-PAGE-TO-ENDPOINT-MAP.md  ← which screens call which endpoints
  AUTH_FLOW.md                         ← (already written) narrative auth/role flow
  DATA_MODELS_AND_ENDPOINTS.md         ← (already written) DB schema + endpoint list
  DESIGN.md                            ← (already written) visual system
```

If your IDE agent (Claude Code, Cursor, etc.) is scaffolding the project, point it at this whole folder as context before it generates either the backend routes or the frontend API client — that's the intended use of keeping all of this in one place.
