# 🚀 Backend Development Guide

> **Getting Started, Project Architecture & Development Best Practices**

---

## 📥 1. Getting Started (Setup & Onboarding)

### **Prerequisites**

- **Node.js**: v22.x or higher
- **pnpm**: v11.21.0 or higher (`npm install -g pnpm`)
- **Docker**: For local PostgreSQL database (optional, `docker-compose.yml` ready)

### **Initial Setup Steps**

```bash
# 1. Clone the backend repository
git clone https://github.com/INSA-Summer-Camp-Project/backend.git
cd backend

# 2. Checkout the `dev` branch & pull latest changes
git checkout dev
git pull origin dev

# 3. Install project dependencies
pnpm install

# 4. Initialize environment configuration
cp .env.example .env

# 5. Create your feature branch (must follow branch naming conventions)
git checkout -b feat/your-feature-name
```

---

## 🏗️ 2. Project Architecture & Folder Structure

The backend workspace follows a **Layered & Decoupled Architecture**:

```text
backend/
├── .agents/               # Project-scoped AI rules & guidelines
├── .github/workflows/     # CI/CD automation pipelines
├── prisma/                # Database schema & migrations
│   └── schema.prisma
├── src/
│   ├── config/            # Centralized Zod environment configuration
│   │   └── env.ts
│   ├── controllers/       # Route controllers (request/response handling)
│   ├── services/          # Pure business logic (decoupled domain logic)
│   ├── routes/            # Express endpoint definitions
│   ├── types/             # Centralized TypeScript interfaces & models
│   │   ├── api.ts
│   │   └── index.ts
│   ├── app.ts             # Express application configuration & middleware
│   └── server.ts          # Server entrypoint & port listener
├── tests/                 # Vitest test suites
│   └── sample.test.ts
├── RULES.md               # Developer Code of Conduct & Rules
└── DEVELOPMENT.md         # This development guide
```

---

## 🧩 3. Architectural Principles & Decoupling Rule

### 🔒 **The Decoupling Principle**

- **Loosely Coupled Modules**: Domain features (e.g. Users, Products, Auth) must be decoupled. Services should not directly mutate internal private states of other unrelated modules.
- **Service Layer Isolation**: All business logic MUST reside in `src/services/`. Controllers (`src/controllers/`) only handle HTTP request validation and response formatting.
- **Explicit Interfaces**: Use shared TypeScript types from `src/types/` rather than hardcoding inline types or using `any`.
- **No Circular Dependencies**: Ensure modules have clear, single-directional dependencies (`routes` ➔ `controllers` ➔ `services` ➔ `database`).

---

## 🛠️ 4. Useful Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Run TypeScript type check
pnpm exec tsc --noEmit

# Run Linter
pnpm lint

# Check Prettier formatting
pnpm format:check

# Format code with Prettier
pnpm format

# Run Unit Tests
pnpm test
```
