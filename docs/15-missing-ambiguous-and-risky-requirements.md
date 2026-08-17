# 15. Missing, Ambiguous, and Risky Requirements

After analyzing the SRS, here are the critical gaps that the team must make executive decisions on before starting.

## 1. Missing Requirements
- **Direct Hire Pricing:** The SRS says customers can "Direct Hire" a worker (FR-025). 
  *Recommendation for MVP:* Support both marketplace and direct hire through the same `Job` entity. A `Job` can have a `source` (`MARKETPLACE` vs `DIRECT_HIRE`) and an optional `targetWorkerId`. If it's a direct hire, the job is only visible to the target worker, who then submits a quote (Application) which the customer accepts. This solves the pricing issue cleanly.

## 2. Ambiguous Requirements
- **Platform Commission (FR-040, FR-041):** The SRS says "ServiceHub receives a percentage". 
  *Recommendation for MVP:* Use Chapa Split Payments. We will add a `PaymentAccount` entity tied to the `WorkerProfile` to store their Chapa subaccount ID. When the customer pays, Chapa automatically sends our percentage to us and the remainder to the worker. Do not build custom escrow or holding logic.

## 3. Contradictions
- **Worker/Business Roles:** The SRS lists them separately (Section 4.2, 4.3) but gives them identical capabilities. Building two identical flows and database structures is a waste of time.
  *Recommendation for MVP:* Drop business providers entirely for now. Build one `WorkerProfile` entity for individuals. We will not include `isBusiness` or `businessName` fields to keep it as simple as possible.
