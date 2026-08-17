# 03. User Roles & Permissions Matrix

This matrix defines exact capabilities based on the SRS. It distinguishes between the System Role (Admin vs User) and the Active Context (Customer vs Worker).

*Note: For MVP simplicity, "Business" is merged with "Worker" logically. They share the same capabilities.*

## Permission Matrix

| Capability | GUEST | CUSTOMER | WORKER | ADMIN | SRS Reference |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Public Discovery** | | | | | |
| View Service Categories | ✓ | ✓ | ✓ | ✓ | FR-020 |
| View Worker Profiles | ✓ | ✓ | ✓ | ✓ | FR-023 |
| Search & Filter Workers | ✓ | ✓ | ✓ | ✓ | FR-021, FR-022 |
| **Authentication** | | | | | |
| Login via Telegram | ✓ | ❌ | ❌ | ❌ | FR-004 |
| **Profile Management** | | | | | |
| Create/Edit Customer Profile | ❌ | ✓ | ❌ | ✓ | FR-007 |
| Create/Edit Worker Profile | ❌ | ❌ | ✓ | ✓ | FR-008 |
| Upload Portfolio/Certs | ❌ | ❌ | ✓ | ✓ | FR-010, FR-011 |
| **Job Marketplace** | | | | | |
| Create/Post a Job | ❌ | ✓ | ❌ | ❌ | FR-026 |
| View Open Public Jobs | ❌ | ❌ | ✓ | ✓ | FR-028 |
| Apply/Bid on a Job | ❌ | ❌ | ✓ | ❌ | FR-029, FR-030 |
| View Applications on Job | ❌ | ✓ | ❌ | ✓ | FR-032 |
| Select/Accept Applicant | ❌ | ✓ | ❌ | ❌ | FR-034 |
| **Direct Hiring** | | | | | |
| Hire Worker Directly | ❌ | ✓ | ❌ | ❌ | FR-025 |
| **Execution & Payment** | | | | | |
| Chat with Match | ❌ | ✓ | ✓ | ❌ | FR-035 |
| Initiate Payment | ❌ | ✓ | ❌ | ❌ | FR-038 |
| Receive Payment Info | ❌ | ❌ | ✓ | ✓ | FR-039 |
| Submit Review/Rating | ❌ | ✓ | ❌ | ❌ | FR-042, FR-043 |
| **Administration** | | | | | |
| Manage Service Categories | ❌ | ❌ | ❌ | ✓ | FR-054 |
| Manage Users/Workers | ❌ | ❌ | ❌ | ✓ | FR-051, FR-052 |
| Delete/Moderate Reviews | ❌ | ❌ | ❌ | ✓ | FR-057 |
| View System Reports | ❌ | ❌ | ❌ | ✓ | FR-059 |

## Critical Constraints Derived from SRS
1. **Workers Cannot Review Customers:** Section 19 (Business Rules) BR-005 explicitly states "Only customers can provide worker reviews in Version 1".
2. **Customers Cannot Apply to Jobs:** A customer profile cannot submit applications. If a user wants to apply, they must switch their context to their Worker Profile.
3. **Admins Cannot Interfere with Payments:** Admins can "monitor" payments (FR-058) but there is no requirement for them to manually process or refund payments in V1.
