# 07. Database Domain Model

Based on the SRS Section 11, here is the streamlined relational schema optimized for a 5-day MVP using PostgreSQL and Prisma.

## Core Entities

### 1. User
Represents the authenticated human.
- `id` (UUID, PK)
- `telegramId` (String, Unique)
- `phone` (String, Unique) - *Required by FR-002*
- `name` (String)
- `systemRole` (Enum: `USER`, `ADMIN`)

### 2. CustomerProfile
- `id` (UUID, PK)
- `userId` (UUID, FK -> User, Unique)
- `bio` (String, Optional)

### 3. WorkerProfile
Merges "Individual" and "Business" to save time.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User, Unique)
- `isBusiness` (Boolean, Default: false)
- `businessName` (String, Optional)
- `bio`, `experience` (String)
- `baseRate` (Decimal, Optional)
- `averageRating` (Float, Default: 0)

### 4. ServiceCategory
Managed by Admin.
- `id` (UUID, PK)
- `name` (String) - e.g., "Plumbing", "Electrical"

### 5. WorkerService (Join Table)
Links workers to the categories they operate in.
- `workerProfileId` (UUID)
- `categoryId` (UUID)

### 6. Job (Service Request)
Created by Customer.
- `id` (UUID, PK)
- `customerId` (UUID, FK -> CustomerProfile)
- `categoryId` (UUID, FK -> ServiceCategory)
- `title`, `description` (String)
- `budget` (Decimal)
- `status` (Enum: `OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED`)
- `assignedWorkerId` (UUID, Nullable, FK -> WorkerProfile)

### 7. Application (Bid)
Created by Worker in response to a Job.
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `workerId` (UUID, FK -> WorkerProfile)
- `proposedPrice` (Decimal)
- `estimatedTime` (String)
- `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`)

### 8. Payment
Records transactions (Chapa/Cash).
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `amount` (Decimal)
- `method` (Enum: `CASH`, `CHAPA`)
- `status` (Enum: `PENDING`, `PAID`, `FAILED`)
- `platformCommission` (Decimal)

### 9. Review
Created by Customer after completion.
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `workerId` (UUID, FK -> WorkerProfile)
- `customerId` (UUID, FK -> CustomerProfile)
- `rating` (Int 1-5)
- `comment` (String)
