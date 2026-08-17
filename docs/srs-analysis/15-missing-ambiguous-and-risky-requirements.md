# 15. Missing, Ambiguous, and Risky Requirements

After analyzing the SRS, here are the critical gaps that the team must make executive decisions on before starting.

## 1. Missing Requirements
- **Direct Hire Pricing:** The SRS says customers can "Direct Hire" a worker (FR-025). But what is the price? The application flow uses "Proposed Price" (FR-030). For a direct hire, there is no application. *Decision needed:* Does the worker profile have a "Base Rate", or does Direct Hire still require a quote phase? 
  *Recommendation for MVP:* Remove "Direct Hire" button entirely. Force all interactions through the "Post a Job -> Invite Worker -> Worker Bids" flow to ensure pricing is captured cleanly.

## 2. Ambiguous Requirements
- **Platform Commission & Escrow (FR-040, FR-041):** The SRS says "ServiceHub receives a percentage" but also "Escrow is not supported". How do you collect commission without holding the money? 
  *Recommendation for MVP:* Customer pays the full amount to ServiceHub's Chapa account. The platform holds it. For the demo, just show "Worker Earnings" on the dashboard. Do not attempt to build automated bank payouts to workers in 5 days.

## 3. High Technical Risks (5-Day Scope)


## 4. Contradictions
- **Worker/Business Roles:** The SRS lists them separately (Section 4.2, 4.3) but gives them identical capabilities. Building two identical flows and database structures is a waste of time.
  *Recommendation for MVP:* Build one `WorkerProfile` entity and add a toggle: `isBusiness: boolean`. Treat them identically in code.
