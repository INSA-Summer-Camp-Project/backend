# 🚀 ServiceHub Backend — Phase 3 Technical Report & Code Walkthrough

> **Milestone Documentation**: Phase 3 (Customer Features: Search, Filters & Profile Discovery)  
> **Repository**: `INSA-Summer-Camp-Project/backend`  
> **Target Audience**: Backend Engineering Team / Group Reviewers

---

## 🎯 1. Phase 3 Overview & Objectives

**Phase 3** focuses on delivering the **Customer Search, Filtering, and Profile Inspection Engine** for the ServiceHub platform. At the end of Phase 3, customers can discover, search, filter, and inspect worker profiles using multi-criteria search options.

### Core Deliverables in Phase 3

1. **Target-Aware Input Validation Middleware**: Updated validation middleware to correctly parse and validate `req.query` for GET requests.
2. **Expanded Search DTO**: Created a comprehensive schema supporting keyword search, minimum rating threshold, rate range filtering, and custom sorting.
3. **Dynamic Prisma Query Engine**: Implemented dynamic SQL `WHERE` and `ORDER BY` builders inside `workerService.getWorkers`.
4. **Dedicated Search API Endpoint**: Added `GET /api/v1/search/providers` following SRS Section 4.7.
5. **Code Standard Refactoring**: Converted relative imports to TypeScript `@/*` path aliases and cleaned up imports.
6. **Automated Search Test Suite**: Created unit/integration tests verifying Phase 3 DTO validation and boundary constraints.

---

## 🏗️ 2. Architectural Flow for Phase 3 Search

```mermaid
flowchart TD
    Client["Client / HTTP Request (GET /api/v1/search/providers?search=electrician&minRating=4.5&sortBy=rating)"] --> Express["Express Application (src/app.ts)"]
    Express --> AuthMw["Authentication Middleware (src/middlewares/auth.middleware.ts)"]
    AuthMw --> ValMw["Target Validation Middleware (src/middlewares/validate.middleware.ts)"]
    ValMw -->|Parses req.query via WorkerQueryDtoSchema| SearchRoute["Search Router (src/routes/search.routes.ts)"]
    SearchRoute --> Controller["Search Controller (src/controllers/search.controller.ts)"]
    Controller --> Service["Worker Service (src/services/worker.service.ts)"]
    Service -->|Dynamic Prisma WHERE & ORDER BY| Prisma["Prisma 7 Driver Adapter (src/lib/prisma.ts)"]
    Prisma --> DB[("PostgreSQL Database")]
    DB -->|Paginated Workers + Meta| Service
    Service --> Controller
    Controller -->|Standard Response { success: true, data: ..., meta: ... }| Client
```

---

## 🧩 3. Phase 3 Code Modifications & Walkthrough

---

### 3.1 Target-Aware Validation Middleware Fix

- **File**: [`src/middlewares/validate.middleware.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/middlewares/validate.middleware.ts)
- **Technical Detail**: The `validate` middleware was refactored to support a second parameter specifying the target request property: `(schema: ZodSchema, target: "body" | "query" | "params" = "body")`.
- **Implementation**:

```typescript
export const validate =
  (schema: ZodSchema, target: "body" | "query" | "params" = "body") =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Asynchronously parse and sanitize input data from the specified target location
      const parsedData = await schema.parseAsync(req[target]);

      // Assign transformed/sanitized data back to the request object
      req[target] = parsedData;

      next();
    } catch (error) {
      // Forward Zod validation errors to global error handling middleware
      next(error);
    }
  };
```

---

### 3.2 Expanded Worker Query DTO & Filter Schemas

- **File**: [`src/dtos/worker.dto.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/dtos/worker.dto.ts)
- **Technical Detail**: Created `WorkerQueryDtoSchema` using Zod coercions to validate incoming URL query string parameters.
- **Implementation**:

```typescript
export const WorkerQueryDtoSchema = z.object({
  /** Filter workers belonging to a specific service category UUID */
  categoryId: z.string().uuid("Invalid category ID format").optional(),

  /** Keyword search across worker bio, experience, and user name */
  search: z.string().min(1, "Search query must not be empty").optional(),

  /** Filter workers with average rating >= minRating (1.0 to 5.0) */
  minRating: z.coerce
    .number()
    .min(1, "Minimum rating must be at least 1.0")
    .max(5, "Minimum rating cannot exceed 5.0")
    .optional(),

  /** Filter workers with base rate >= minRate */
  minRate: z.coerce
    .number()
    .min(0, "Minimum rate cannot be negative")
    .optional(),

  /** Filter workers with base rate <= maxRate */
  maxRate: z.coerce
    .number()
    .min(0, "Maximum rate cannot be negative")
    .optional(),

  /** Sorting order: 'rating' (default), 'jobs', 'newest', 'rate_asc', 'rate_desc' */
  sortBy: z
    .enum(["rating", "jobs", "newest", "rate_asc", "rate_desc"])
    .default("rating"),

  /** Current page index (1-based, defaults to 1) */
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),

  /** Items per page limit (1 to 50, defaults to 20) */
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50, "Limit cannot exceed 50")
    .default(20),
});
```

---

### 3.3 Dynamic Search & Filtering Engine in Worker Service

- **File**: [`src/services/worker.service.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/services/worker.service.ts)
- **Technical Detail**: Rewrote `getWorkers` to dynamically construct Prisma SQL `WHERE` and `ORDER BY` conditions based on active query parameters.
- **Implementation**:

```typescript
export const getWorkers = async (query: WorkerQueryDto) => {
  const {
    categoryId,
    search,
    minRating,
    minRate,
    maxRate,
    sortBy,
    page,
    limit,
  } = query;

  // Build dynamic Prisma WHERE conditions array
  const AND: Prisma.WorkerProfileWhereInput[] = [];

  // Filter 1: Service Category
  if (categoryId) {
    AND.push({ services: { some: { categoryId } } });
  }

  // Filter 2: Substring search across worker bio, experience, and associated user name
  if (search && search.trim()) {
    const trimmed = search.trim();
    AND.push({
      OR: [
        { bio: { contains: trimmed, mode: "insensitive" } },
        { experience: { contains: trimmed, mode: "insensitive" } },
        { user: { name: { contains: trimmed, mode: "insensitive" } } },
      ],
    });
  }

  // Filter 3: Minimum rating threshold
  if (minRating !== undefined) {
    AND.push({ averageRating: { gte: minRating } });
  }

  // Filter 4: Base rate minimum & maximum thresholds
  if (minRate !== undefined) AND.push({ baseRate: { gte: minRate } });
  if (maxRate !== undefined) AND.push({ baseRate: { lte: maxRate } });

  const where: Prisma.WorkerProfileWhereInput = AND.length > 0 ? { AND } : {};

  // Build dynamic Prisma ORDER BY sorting clause
  let orderBy: Prisma.WorkerProfileOrderByWithRelationInput[];

  switch (sortBy) {
    case "jobs":
      orderBy = [{ verifiedJobCount: "desc" }, { averageRating: "desc" }];
      break;
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "rate_asc":
      orderBy = [{ baseRate: "asc" }, { averageRating: "desc" }];
      break;
    case "rate_desc":
      orderBy = [{ baseRate: "desc" }, { averageRating: "desc" }];
      break;
    case "rating":
    default:
      orderBy = [
        { averageRating: "desc" },
        { verifiedJobCount: "desc" },
        { createdAt: "desc" },
      ];
      break;
  }

  const skip = (page - 1) * limit;

  // Concurrently fetch records and total count for pagination metadata
  const [workers, total] = await Promise.all([
    prisma.workerProfile.findMany({
      where,
      select: workerListSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.workerProfile.count({ where }),
  ]);

  return {
    workers,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
```

---

### 3.4 Dedicated Search Router & Controller (SRS Section 4.7)

- **Files**:
  - Controller: [`src/controllers/search.controller.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/controllers/search.controller.ts)
  - Router: [`src/routes/search.routes.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/routes/search.routes.ts)
  - Router Mount: [`src/routes/index.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/routes/index.ts)
- **Technical Detail**: Created `GET /api/v1/search/providers` endpoint that delegates query validation and processing to `workerService.getWorkers`.

---

### 3.5 Code Standards & Path Alias Standardization

- **File**: [`src/server.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/server.ts)
  - Replaced relative imports (`./app`, `./config/env`) with `@/app` and `@/config/env` path aliases.
- **File**: [`src/middlewares/auth.middleware.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/src/middlewares/auth.middleware.ts)
  - Moved mid-file `prisma` and `ActiveRole` imports to top of file.

---

### 3.6 Automated Search Test Suite

- **File**: [`tests/phase3-search.test.ts`](file:///c:/Users/Hp/Documents/INSA%20summer%20camp/ServiceHub%20Web-Project/Backend/backend/tests/phase3-search.test.ts)
- **Technical Detail**: Implemented test assertions verifying search DTO coercions, default fallback values, boundary conditions (`minRating > 5.0`), and negative rate handling.

---

## 🌐 4. Phase 3 API Surface Reference

| Endpoint                   | Method | Query Parameters                                                                     | Description                                                                        | Response Data                                        |
| :------------------------- | :----: | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `/api/v1/search/providers` | `GET`  | `search`, `categoryId`, `minRating`, `minRate`, `maxRate`, `sortBy`, `page`, `limit` | Dedicated provider search & multi-filter endpoint                                  | List of matching worker profiles + pagination `meta` |
| `/api/v1/workers`          | `GET`  | `search`, `categoryId`, `minRating`, `minRate`, `maxRate`, `sortBy`, `page`, `limit` | Browse and filter workers                                                          | List of matching worker profiles + pagination `meta` |
| `/api/v1/workers/:id`      | `GET`  | None                                                                                 | Get public worker profile details (including portfolio, certificates, and reviews) | Full worker profile object                           |

---

## ✅ 5. Verification Checklist

- [x] **Validation Target Bug Fix**: `validate(WorkerQueryDtoSchema, "query")` correctly validates `req.query`.
- [x] **Keyword Search**: Performs case-insensitive substring search across bio, experience, and user name.
- [x] **Rating & Rate Filters**: Filters workers by `averageRating >= minRating` and base rate range.
- [x] **Dynamic Sorting**: Supports sorting by rating, verified jobs count, recency, and rate price (asc/desc).
- [x] **Path Alias Standardization**: All imports in `src/server.ts` and `src/middlewares/auth.middleware.ts` use `@/*` path aliases.
- [x] **Unit Testing**: Passed all Vitest assertions in `tests/phase3-search.test.ts`.
