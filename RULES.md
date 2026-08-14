# 📜 Developer Code of Conduct & Development Rules

> **Mandatory Guidelines & Workflow Rules for `INSA-Summer-Camp-Project` Backend**

---

## 1. 🌿 Branch Naming Conventions

Every feature branch **MUST** follow one of these exact prefixes (enforced by git hooks):

| Prefix                | Usage                                     | Example                           |
| :-------------------- | :---------------------------------------- | :-------------------------------- |
| `feat/` or `feature/` | New feature implementation                | `feat/user-authentication`        |
| `fix/` or `bugfix/`   | Bug fixes                                 | `fix/header-navigation-alignment` |
| `refactor/`           | Code refactoring without behavior change  | `refactor/api-response-handler`   |
| `test/`               | Adding or updating unit/integration tests | `test/auth-service-tests`         |
| `chore/`              | Dependency updates, tooling, config       | `chore/update-dependencies`       |
| `hotfix/`             | Emergency production fix                  | `hotfix/cors-origin-fix`          |

---

## 2. 🔄 The 5-Step Development Lifecycle

```text
1. Branch ──► 2. Build ──► 3. Test ──► 4. Verify ──► 5. Pull Request
```

### **Step 1: Create a Feature Branch**

Always start from `dev` and pull the latest changes before creating your branch:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

### **Step 2: Build the Feature**

- Write clean, modular code following the project guidelines in `.agents/AGENTS.md` and `DEVELOPMENT.md`.
- **Decoupling Rule**: Features and modules must be loosely coupled. Do NOT tightly couple unrelated domain modules or create circular dependencies.
- **Environment Variables**: Never access `process.env` directly. Always import `env` from `@/config/env`.
- **Layering**: Follow strict layer separation: **Routes** (`src/routes`) → **Controllers** (`src/controllers`) → **Services** (`src/services`) → **Prisma ORM**.
- **Response Format**: Return standard JSON responses (`{ "success": true, "data": ... }` or `{ "success": false, "error": "..." }`).

### **Step 3: Write Tests for Every New Feature**

- Every new endpoint, service method, or utility component **MUST** come with corresponding test cases.
- Place unit tests in `tests/*.test.ts`.

### **Step 4: Local Pre-Push Verification Checklist**

Before pushing your branch, run the full verification suite locally:

```bash
# 1. Type Check
pnpm exec tsc --noEmit

# 2. Lint Check
pnpm lint

# 3. Format Check (or run 'pnpm format' to auto-fix)
pnpm format:check

# 4. Run Tests
pnpm test
```

### **Step 5: Push & Create Pull Request**

- Push your branch to GitHub:
  ```bash
  git push origin feat/your-feature-name
  ```
- Open a Pull Request targeting the **`dev`** branch (never directly to `main`).
- Provide a clear PR title and summary detailing what was built/fixed and verification status.

---

## 3. 🚨 Golden Rules (Do's and Don'ts)

| ❌ **DONT'S**                                                                 | ✅ **DO'S**                                                                  |
| :---------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **Don't** push directly to `main` or `dev`.                                   | **Do** push to a feature branch and open a PR to `dev`.                      |
| **Don't** tightly couple features or create circular module dependencies.     | **Do** keep modules loosely coupled and maintain clean layer isolation.      |
| **Don't** use `process.env["KEY"] ?? ""` fallback defaults scattered in code. | **Do** declare environment variables in `src/config/env.ts` with Zod schema. |
| **Don't** use `any` or bypass TypeScript errors with `// @ts-ignore`.         | **Do** write strict, explicit TypeScript interfaces in `src/types/`.         |
| **Don't** skip writing unit tests for new endpoints or business logic.        | **Do** add tests in `tests/` verifying success and failure scenarios.        |
| **Don't** bypass local hooks unless strictly necessary.                       | **Do** fix linting/formatting errors locally before pushing.                 |
