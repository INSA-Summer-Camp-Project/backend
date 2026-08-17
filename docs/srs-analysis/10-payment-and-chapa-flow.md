# 10. Payment & Chapa Flow Analysis

The SRS mandates Cash, Telebirr, and Chapa (FR-038) and a "Platform Commission" (FR-040). Escrow is explicitly excluded (FR-041).

## 1. The Architectural Dilemma (Missing from SRS)
If the platform takes a commission, but Escrow is not supported, how does money flow?
- **Option A (Worker receives money, owes platform):** Customer pays worker in cash. Worker's account accrues "debt" to the platform. *Too complex for a 5-day MVP (requires billing logic and suspensions).*
- **Option B (Platform receives money, pays worker later):** Customer pays via Chapa to the Platform. Platform holds money, pays worker offline on Friday. *Technically this is Escrow/Holding, which the SRS says is unsupported, but it's the easiest way to guarantee commission.*
- **Option C (Chapa Split Payment):** Customer pays via Chapa. Chapa automatically sends 90% to the Worker's bank account and 10% to the Platform.

**Recommendation for 5-Day MVP:**
Use Option B logically. Customer pays via Chapa to the platform's main API key. The database records the `Payment` as `PAID` and calculates the `platformCommission`. Don't build the automated payout system to workers in 5 days; just record the numbers on the dashboard.

## 2. The Chapa Integration Flow
1. **Initiation:** Customer clicks "Pay via Chapa" on `/customer/checkout/[jobId]`.
2. **Backend Call:** Frontend calls `POST /api/payments/initialize`. Backend creates a pending `Payment` record and calls Chapa API.
3. **Redirect:** Backend returns Chapa's `checkout_url`. Frontend redirects customer to Chapa.
4. **Customer Pays on Chapa.**
5. **Webhook:** Chapa fires a webhook to `POST /api/webhooks/chapa`. 
   - *CRITICAL:* The webhook must verify the Chapa hash signature.
   - Backend updates `Payment.status = PAID`.
   - Backend updates `Job.status = COMPLETED`.
6. **Frontend Verification:** Customer is redirected back to `/customer/jobs/[id]`. The frontend polls or relies on the database state to show "Payment Successful".

## 3. Risks
- **Duplicate Webhooks:** Chapa might send the success webhook twice. The backend must check `if (payment.status === 'PAID') return;` before processing.
- **Frontend lying:** The frontend redirect URL from Chapa (`return_url`) should NEVER trigger the database update. Only the secure backend webhook should update the payment status.
