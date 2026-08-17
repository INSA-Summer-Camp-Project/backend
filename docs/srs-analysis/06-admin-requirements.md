# 06. Admin Requirements

The Admin is responsible for platform integrity, moderation, and managing the taxonomy of the marketplace.

## 1. What the Admin Sees (Pages)
- **Admin Dashboard:** High-level metrics (Total Users, Active Jobs, Total Payments).
- **User Management Table:** List of all users, filtering by Customer/Worker, with suspend/delete actions.
- **Category Management:** UI to Add/Edit/Delete the master list of Service Categories.
- **Reports & Moderation:** A queue of user-submitted reports and flagged reviews.

## 2. Admin Capabilities
- **Taxonomy (Service Categories):** Admins strictly control the `ServiceCategory` table (FR-054). Workers cannot invent their own categories (e.g., a worker cannot create "Spaceship Repair" if the admin hasn't added it).
- **User Moderation:** Admins can view all registered users and manage them (FR-051). *Assumption:* This includes soft-deleting or suspending accounts that violate terms.
- **Review Moderation:** Admins can delete or hide inappropriate reviews (FR-057).
- **Payment Monitoring:** Admins can view transaction logs (FR-058).

## 3. Implementation Order & MVP Priority
Admin features are **P1/P2** for the 5-day MVP. The core marketplace (Customer ↔ Worker) must work first.

**Development Plan for Admin:**
1. **Day 1:** Just seed the database with predefined `ServiceCategories` directly via Prisma/SQL so workers can onboard. 
2. **Day 4:** If time permits, build the basic Admin Dashboard to view users and delete reviews. 
3. Do not spend Day 1 or 2 building complex admin tables. Use direct database access for moderation during the demo if necessary.
