# 07. Database Domain Model

Based on the SRS Section 11, here is the streamlined relational schema optimized for a 5-day MVP using PostgreSQL and Prisma.

## Core Entities

### 1. User
Represents the authenticated human.
- `id` (UUID, PK)
- `telegramId` (String, Unique)
- `name` (String)
- `systemRole` (Enum: `USER`, `ADMIN`)
- `lastActiveRole` (Enum: `CUSTOMER`, `WORKER`, Nullable) - Remembers their last dashboard context.
- `createdAt`, `updatedAt` (DateTime)

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
- `profileImageUrl` (String, Optional) - Cloudinary URL
- `profileImagePublicId` (String, Optional) - Cloudinary Public ID
- `createdAt`, `updatedAt` (DateTime)

### 4. ServiceCategory
Managed by Admin.
- `id` (UUID, PK)
- `name` (String) - e.g., "Plumbing", "Electrical"
- `createdAt`, `updatedAt` (DateTime)

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
- `createdAt`, `updatedAt` (DateTime)

### 7. Application (Bid)
Created by Worker in response to a Job.
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `workerId` (UUID, FK -> WorkerProfile)
- `proposedPrice` (Decimal)
- `estimatedTime` (String)
- `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`)
- `createdAt`, `updatedAt` (DateTime)

### 8. Payment
Records transactions (Chapa/Cash).
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `amount` (Decimal)
- `currency` (String, Default: "ETB")
- `method` (Enum: `CASH`, `CHAPA`)
- `status` (Enum: `PENDING`, `PAID`, `FAILED`)
- `txRef` (String, Unique) - Essential for Chapa Webhooks.
- `platformCommission` (Decimal)
- `createdAt`, `updatedAt` (DateTime)

### 9. Review
Created by Customer after completion.
- `id` (UUID, PK)
- `jobId` (UUID, FK -> Job)
- `workerId` (UUID, FK -> WorkerProfile)
- `customerId` (UUID, FK -> CustomerProfile)
- `rating` (Int 1-5)
- `comment` (String)
- `createdAt`, `updatedAt` (DateTime)

### 10. PortfolioItem
Added per SRS 11.7.
- `id` (UUID, PK)
- `workerId` (UUID, FK -> WorkerProfile)
- `title`, `description` (String)
- `imageUrl` (String) - Cloudinary URL
- `imagePublicId` (String) - Cloudinary Public ID
- `createdAt`, `updatedAt` (DateTime)

### 11. Certificate
Added per SRS 11.8.
- `id` (UUID, PK)
- `workerId` (UUID, FK -> WorkerProfile)
- `title` (String)
- `fileUrl` (String) - Cloudinary URL
- `filePublicId` (String) - Cloudinary Public ID
- `createdAt`, `updatedAt` (DateTime)

