# 05. Worker Requirements

The Worker (Individual or Business) represents the supply-side of the marketplace.

## 1. What the Worker Sees (Pages)

- **Worker Dashboard:** A hub showing jobs they have won (Active Jobs), their Pending Applications, and their Profile stats (Rating, Total Earnings).
- **Job Feed:** A searchable list of public jobs posted by Customers that match their service categories.
- **Profile Editor:** A page to update their bio, pricing, upload certificates, and add portfolio images.

## 2. Worker Capabilities

- **Onboarding:** They must define the `Service Categories` they operate in (e.g., Plumbing, Electrical) (FR-019).
- **Portfolio Management:** They can upload images of past work and certificates to build trust (FR-010).
- **Bidding on Jobs:** They view public jobs and submit an `Application`.
  - _Crucial Requirement:_ The application must include a `Proposed Price` and `Estimated Completion Time` (FR-030, FR-031). The worker does not have to accept the customer's stated budget.
- **Execution:** They communicate with the customer and mark the job as "Completed" when finished.

## 3. What the Worker Cannot Do

- **Cannot Rate Customers:** Version 1 explicitly forbids workers from rating customers (BR-005).
- **Cannot See Competitor Bids:** To prevent a race to the bottom, workers should not see the prices proposed by other workers on the same job.
- **Cannot Accept Their Own Applications:** Only the Customer can accept an application.

## MVP Implementation Recommendation

The SRS distinguishes between "Individual Workers" and "Businesses" (Sections 4.2 and 4.3). However, reading their capabilities, they are functionally identical in Version 1.

**Recommendation:** Do not create separate `Worker` and `Business` database tables or flows. Create a single `WorkerProfile` table with a boolean flag `isBusiness: boolean`. This will cut backend development time in half.
