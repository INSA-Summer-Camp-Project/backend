# Monetization & Anti-Leakage Decisions

This document records product and technical decisions regarding ServiceHub's revenue model, specifically concerning the risk of platform disintermediation (payment leakage).

## The Risk
ServiceHub relies on a commission-based model. There is a known risk that customers and workers, once matched, could exchange payment directly (via cash or bank transfer) to bypass platform fees, since contact information (e.g., Telegram handles, phone numbers) must be revealed to coordinate the service delivery.

## MVP Decision
**We are NOT gating contact reveal behind payment initiation for the MVP.** 

Instead, we are relying on **platform reputation** as the primary incentive for workers to keep transactions on ServiceHub. 

A worker's visible "Jobs Completed through ServiceHub" and "Verified Earnings" will serve as a strong trust signal to future customers. Because workers have a strong incentive to build their profile reputation to win future jobs, they are incentivized to route payments through the platform.

### Implementation Details:
- The `WorkerProfile` contains `verifiedJobCount` and `verifiedEarningsTotal`.
- These fields are automatically incremented by the backend only when a `Payment` transitions to `PAID` via the Chapa webhook.
- The UI will display this as evidence (e.g., "86 jobs completed through ServiceHub") alongside their average rating and response time.
- `GET /hiring/:id/contact` (or the equivalent messaging entrypoint) is unlocked immediately after a worker is selected for a job, without requiring upfront payment.

## Deferred Mechanisms
The following mechanisms were considered but explicitly **deferred**. They are NOT decided against, but they add unnecessary complexity to the 5-day MVP and should only be evaluated post-MVP once we have real usage data on how often leakage actually occurs:

1. Gating contact reveal behind upfront payment.
2. Charging upfront booking fees before a worker can be hired.
3. Strict enforcement of Chapa subaccount splits prior to job assignment.
4. Feature tiering (e.g., offering benefits for platform payments vs cash).
