# Final Merge: Port Remaining Backup Fields to Dev

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the last two useful fields from backup (`Certificate.filePublicId`, `Portfolio.imagePublicId`) into dev's schema, then merge back.

**Architecture:** Create a safe branch from dev, add the fields, generate migration, update DTOs/services, verify tests, merge back to dev.

**Tech Stack:** Prisma 7, PostgreSQL, TypeScript, Vitest

## Context

The consolidation between `dev` and `backup/feat/mvp-reference` is 99% complete. The branches have **fundamentally different schemas** (dev uses `Worker`/`Service`/`Category`/`Portfolio`, backup uses `WorkerProfile`/`WorkerService`/`ServiceCategory`/`PortfolioItem`). A git merge is impossible — the models are incompatible.

The only remaining useful pieces from backup are two optional fields for Cloudinary cleanup:

- `Certificate.filePublicId` — needed to delete files from Cloudinary
- `Portfolio.imagePublicId` — needed to delete images from Cloudinary

Everything else from backup (simpler jobs, unidirectional reviews, no admin, no search) is already superseded by dev's richer implementation.

## Global Constraints

- Branch from `dev`, merge back to `dev`
- Schema change must be backwards-compatible (optional fields)
- All 67 existing tests must pass
- Prisma migration required

---

### Task 1: Create merge branch from dev

- [ ] **Step 1: Create and switch to new branch**

Run: `git checkout -b merge/backup-final-fields dev`
Expected: switched to new branch

- [ ] **Step 2: Verify starting point**

Run: `git log --oneline -3`
Expected: shows dev's latest commits

---

### Task 2: Add `filePublicId` to Certificate model

**Files:**

- Modify: `prisma/schema.prisma` (Certificate model)

- [ ] **Step 1: Add field to schema**

In `prisma/schema.prisma`, add `filePublicId` to the Certificate model:

```prisma
model Certificate {
  id           String    @id @default(uuid())
  workerId     String    @map("worker_id")
  title        String
  fileUrl      String    @map("file_url")
  filePublicId String?   @map("file_public_id")
  issuedDate  DateTime? @map("issued_date") @db.Date

  worker Worker @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@map("certificates")
}
```

- [ ] **Step 2: Verify schema is valid**

Run: `pnpm prisma format && pnpm prisma validate`
Expected: no errors

---

### Task 3: Add `imagePublicId` to Portfolio model

**Files:**

- Modify: `prisma/schema.prisma` (Portfolio model)

- [ ] **Step 1: Add field to schema**

In `prisma/schema.prisma`, add `imagePublicId` to the Portfolio model:

```prisma
model Portfolio {
  id            String   @id @default(uuid())
  workerId      String   @map("worker_id")
  title         String
  description   String?  @db.Text
  imageUrl      String   @map("image_url")
  imagePublicId String?  @map("image_public_id")
  createdAt     DateTime @default(now()) @map("created_at")

  worker Worker @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@map("portfolios")
}
```

- [ ] **Step 2: Verify schema is valid**

Run: `pnpm prisma format && pnpm prisma validate`
Expected: no errors

---

### Task 4: Generate and apply Prisma migration

- [ ] **Step 1: Generate migration**

Run: `$env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION='approve-all'; pnpm prisma migrate dev --name add_cloudinary_public_ids`
Expected: migration created, client regenerated

- [ ] **Step 2: Verify migration file exists**

Run: `Get-ChildItem prisma/migrations -Name | Select-Object -Last 1`
Expected: shows a directory like `20260821_add_cloudinary_public_ids`

---

### Task 5: Update profile DTOs to include new fields

**Files:**

- Modify: `src/dtos/profile.dto.ts`

- [ ] **Step 1: Add `imagePublicId` to portfolio DTO**

In `src/dtos/profile.dto.ts`, update `CreatePortfolioItemDtoSchema`:

```typescript
export const CreatePortfolioItemDtoSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  imageUrl: z.string().url("Invalid image URL"),
  imagePublicId: z.string().min(1, "Image public ID is required"),
});

export type CreatePortfolioItemDto = z.infer<
  typeof CreatePortfolioItemDtoSchema
>;
```

- [ ] **Step 2: Add `filePublicId` to certificate DTO**

In `src/dtos/profile.dto.ts`, update `CreateCertificateDtoSchema`:

```typescript
export const CreateCertificateDtoSchema = z.object({
  title: z.string().min(2, "Title is required"),
  fileUrl: z.string().url("Invalid file URL"),
  filePublicId: z.string().min(1, "File public ID is required"),
});

export type CreateCertificateDto = z.infer<typeof CreateCertificateDtoSchema>;
```

---

### Task 6: Update profile service to use new fields

**Files:**

- Modify: `src/services/profile.service.ts`

- [ ] **Step 1: Update `addPortfolioItem` to include `imagePublicId`**

In `src/services/profile.service.ts`, update the portfolio creation:

```typescript
export const addPortfolioItem = async (
  userId: string,
  dto: CreatePortfolioItemDto,
) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!worker) {
    throw new NotFoundError(
      "Worker profile not found. Please register as a worker first.",
    );
  }

  return prisma.portfolio.create({
    data: {
      workerId: worker.id,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      imagePublicId: dto.imagePublicId,
    },
  });
};
```

- [ ] **Step 2: Update `addCertificate` to include `filePublicId`**

In `src/services/profile.service.ts`, update the certificate creation:

```typescript
export const addCertificate = async (
  userId: string,
  dto: CreateCertificateDto,
) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!worker) {
    throw new NotFoundError(
      "Worker profile not found. Please register as a worker first.",
    );
  }

  return prisma.certificate.create({
    data: {
      workerId: worker.id,
      title: dto.title,
      fileUrl: dto.fileUrl,
      filePublicId: dto.filePublicId,
    },
  });
};
```

---

### Task 7: Update portfolio/certificate selects to return new fields

**Files:**

- Modify: `src/services/worker.service.ts`

- [ ] **Step 1: Add `imagePublicId` to portfolio select**

In `src/services/worker.service.ts`, in the `workerDetailSelect` object, update the portfolios select:

```typescript
portfolios: {
  select: {
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    imagePublicId: true,
    createdAt: true,
  },
},
```

- [ ] **Step 2: Add `filePublicId` to certificate select**

In `src/services/worker.service.ts`, in the `workerDetailSelect` object, update the certificates select:

```typescript
certificates: {
  select: {
    id: true,
    title: true,
    fileUrl: true,
    filePublicId: true,
    issuedDate: true,
  },
},
```

---

### Task 8: Run TypeScript check and tests

- [ ] **Step 1: TypeScript check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: 67/67 tests pass

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 errors

---

### Task 9: Commit and merge back to dev

- [ ] **Step 1: Stage and commit**

Run: `git add . && git commit -m "feat: add filePublicId and imagePublicId for Cloudinary cleanup"`
Expected: commit succeeds

- [ ] **Step 2: Switch to dev**

Run: `git checkout dev`
Expected: switched to dev

- [ ] **Step 3: Merge the branch**

Run: `git merge merge/backup-final-fields --no-ff -m "merge: port Cloudinary public ID fields from backup"`
Expected: merge succeeds (no conflicts since branch was created from dev)

- [ ] **Step 4: Verify tests still pass**

Run: `pnpm test`
Expected: 67/67 tests pass

- [ ] **Step 5: Delete merge branch**

Run: `git branch -d merge/backup-final-fields`
Expected: branch deleted

---

## Verification Checklist

After all tasks:

1. `prisma validate` passes
2. Migration applies cleanly
3. `tsc --noEmit` shows 0 errors
4. `pnpm test` shows 67/67 pass
5. `pnpm lint` shows 0 errors
6. Certificate model has `filePublicId` field
7. Portfolio model has `imagePublicId` field
8. Both fields are optional (backwards-compatible)
9. Dev branch has the merge commit
