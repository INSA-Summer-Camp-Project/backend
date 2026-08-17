# 01. Product Overview & Core Workflows

## 1. The Core Problem ServiceHub Solves
ServiceHub acts as a centralized trust and discovery layer for the informal service sector. 
- **Customers** struggle to find, vet, and safely hire reliable service providers (e.g., plumbers, cleaners, tutors) without relying on scattered personal recommendations.
- **Workers/Businesses** lack a unified platform to showcase their portfolios, verify their skills, build public reputation, and access a wider customer base.

## 2. Main Users
- **Customers:** Individuals seeking to hire someone for a specific task.
- **Workers (Individual) & Businesses:** Professionals offering services. *(Note: For the MVP, Individuals and Businesses should be treated as the exact same technical entity to save time, simply distinguished by a profile flag).*
- **Administrators:** Platform operators managing categories, resolving disputes, and monitoring payments.

## 3. Primary Business Workflows
The SRS specifies a **Dual Marketplace Model** (Section 29):

**Model 1: Provider-Driven (Job Posting - Best for price discovery)**
Customer Posts a Job → Workers see it and submit Applications (Bids) → Customer compares Bids (Price/Time/Rating) → Customer Selects a Worker → Service Executed → Payment → Review.

**Model 2: Customer-Driven (Direct Hire - Best for known needs)**
Customer searches for a specific service (e.g., "Plumber") → Browses Worker Profiles → Evaluates Portfolios/Ratings → Contacts/Hires Worker Directly → Service Executed → Payment → Review.

## 4. The Essential MVP End-to-End Journey
To prove the product works in 5 days, the absolute essential journey we must build is the **Job Posting Flow**:
1. User logs in via Telegram and creates a Customer Profile.
2. Customer publishes a Job Request ("Need a leaking pipe fixed, budget 500 ETB").
3. Another User logs in, creates a Worker Profile, and sees the Job.
4. Worker applies with a proposed price (600 ETB) and time (2 hours).
5. Customer accepts the application.
6. Service is marked completed.
7. Customer pays via Chapa and leaves a 5-star rating.

## 5. What is Essential vs. Postponed (MVP Prioritization)
**Essential (P0):**
- Telegram Auth & Role switching.
- Job posting & Bidding system.
- Basic Search/Filtering.
- Payment integration (Chapa).
- Ratings & Reviews.

**Postponed (Do NOT build in 5 days):**
- **Escrow** (Explicitly excluded in V1 per FR-041).
- **GPS / Location matching** (Explicitly excluded per Section 22.1).
- **Advanced Verification badges** (Section 22.5).
- **Multi-language support** (English only per Section 22.2).
- **Complex real-time Chat** (FR-036 requires chat, but WebSockets in 5 days is a massive risk. Scope down to simple message threads or off-platform Telegram links).
