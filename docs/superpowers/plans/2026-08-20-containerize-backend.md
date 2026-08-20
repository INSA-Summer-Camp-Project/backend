# Containerize ServiceHub Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the entire backend — Node.js app + PostgreSQL + Prisma — so `docker compose up` starts a fully working development environment.

**Architecture:** Multi-stage Dockerfile (builder installs deps, runner runs the app). docker-compose.yml orchestrates app + PostgreSQL with health checks. Prisma migrate runs at startup via entrypoint script. tsx used at runtime (handles ESM + path aliases natively).

**Tech Stack:** Node 22 Alpine, pnpm, tsx, Prisma 7, PostgreSQL 17, Docker Compose v2.

## Global Constraints

- `pnpm` as package manager (devEngines enforced)
- ESM (`"type": "module"` in package.json)
- Path aliases via `@/*` → tsx resolves at runtime
- Prisma 7 with `prisma.config.ts`
- PostgreSQL 17
- `.env` file for secrets (not baked into image)
- Health check: `GET /api/health`

---

## File Structure

| File                   | Purpose                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `Dockerfile`           | Replace existing (was PostgreSQL-only). Multi-stage Node.js app build           |
| `docker-compose.yml`   | Replace existing. Add app service + networking                                  |
| `.dockerignore`        | Exclude .git, node_modules, etc. from build context                             |
| `.env.example`         | Add missing Chapa/Cloudinary vars, update DATABASE_URL for container networking |
| `docker-entrypoint.sh` | Run prisma migrate + start app                                                  |

---

### Task 1: Create `.dockerignore`

**Files:**

- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

```gitignore
.git
.gitignore
.env
.env.*
!.env.example
node_modules
dist
tests
docs
*.md
.vscode
.idea
```

- [ ] **Step 2: Verify .dockerignore exists**

Run: `Get-Content .dockerignore | Select-Object -First 5`
Expected: shows .git, node_modules, etc.

---

### Task 2: Replace `Dockerfile` (multi-stage Node.js app)

**Files:**

- Modify: `Dockerfile` (replace PostgreSQL-only with Node.js app)

**Key decisions:**

- Runtime: tsx (handles ESM + `@/*` path aliases without build step)
- Base: `node:22-alpine` (current LTS)
- Prisma generate runs in builder stage
- `pnpm prune --prod` in runner stage for minimal production deps

- [ ] **Step 1: Write the new Dockerfile**

```dockerfile
# ---- builder stage ----
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ---- runner stage ----
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g tsx
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json ./
COPY src ./src/
RUN pnpm prune --prod

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
```

- [ ] **Step 2: Verify Dockerfile syntax**

Run: `docker build --no-cache --target builder -t backend-builder-test . 2>&1 | Select-Object -Last 5`
Expected: "exporting to image" or similar success message

---

### Task 3: Create `docker-entrypoint.sh`

**Files:**

- Create: `docker-entrypoint.sh`

**Purpose:** Run Prisma migrate then start the app.

- [ ] **Step 1: Write entrypoint script**

```bash
#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Starting application..."
exec node --import tsx src/server.ts
```

- [ ] **Step 2: Verify entrypoint is executable**

Run: `Get-Content docker-entrypoint.sh`
Expected: shows the shebang and commands

---

### Task 4: Replace `docker-compose.yml`

**Files:**

- Modify: `docker-compose.yml`

**Architecture:**

- `postgres` service: PostgreSQL 17, health check via pg_isready
- `app` service: Node.js app, depends on postgres (healthy), port 3000
- `postgres_data` volume: persists DB across restarts

- [ ] **Step 1: Write docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: backend_postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-backend_db}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-backend_db}",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        DATABASE_URL: "postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-backend_db}?schema=public"
    container_name: backend_app
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: "postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-backend_db}?schema=public"
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      JWT_SECRET: ${JWT_SECRET}
      JWT_ACCESS_EXPIRES_IN: ${JWT_ACCESS_EXPIRES_IN:-15m}
      TELEGRAM_CLIENT_ID: ${TELEGRAM_CLIENT_ID}
      TELEGRAM_CLIENT_SECRET: ${TELEGRAM_CLIENT_SECRET}
      TELEGRAM_REDIRECT_URI: ${TELEGRAM_REDIRECT_URI}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TELEGRAM_BOT_USERNAME: ${TELEGRAM_BOT_USERNAME}
      TELEGRAM_OIDC_COOKIE_SECRET: ${TELEGRAM_OIDC_COOKIE_SECRET}
      CLOUDINARY_URL: ${CLOUDINARY_URL}
      CHAPA_PUBLIC_KEY: ${CHAPA_PUBLIC_KEY}
      CHAPA_SECRET_KEY: ${CHAPA_SECRET_KEY}
      CHAPA_ENCRYPTION_KEY: ${CHAPA_ENCRYPTION_KEY}
      CHAPA_RETURN_URL: ${CHAPA_RETURN_URL}
      CHAPA_CALLBACK_URL: ${CHAPA_CALLBACK_URL}
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

- [ ] **Step 2: Verify compose config is valid**

Run: `docker compose config 2>&1 | Select-Object -First 10`
Expected: valid YAML output, no errors

---

### Task 5: Update `.env.example`

**Files:**

- Modify: `.env.example`

**Changes:** Add Chapa/Cloudinary vars, add container-friendly DATABASE_URL, add APP_PORT, add TELEGRAM_BOT_USERNAME.

- [ ] **Step 1: Write .env.example**

```env
# PostgreSQL Database Connection
POSTGRES_DB=backend_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Prisma Database Connection URL (use localhost for local dev, postgres for Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backend_db?schema=public"

# Frontend Application Origin for CORS
FRONTEND_URL="http://localhost:3000"

# JWT Secrets
JWT_SECRET="your-access-token-secret-at-least-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"

# Telegram OIDC (FAKE VALUES FOR TESTING)
TELEGRAM_CLIENT_ID=your_telegram_client_id
TELEGRAM_CLIENT_SECRET=your_telegram_client_secret
TELEGRAM_REDIRECT_URI=your_telegram_redirect_uri
TELEGRAM_BOT_TOKEN="123456789:AAFakeTokenForTestingOnlyDoNotUse0000"
TELEGRAM_BOT_USERNAME="fake_test_bot"
TELEGRAM_OIDC_COOKIE_SECRET=some-long-random-secret-key-that-is-at-least-32-chars

# Cloudinary (optional - FAKE VALUES FOR TESTING)
CLOUDINARY_URL="cloudinary://fake_key:fake_secret@fake_cloud_name"

# Chapa Payments (optional - FAKE VALUES FOR TESTING)
CHAPA_PUBLIC_KEY="CHAPUBK-test-fakekey123456"
CHAPA_SECRET_KEY="CHASECK_TEST-fakekey123456"
CHAPA_ENCRYPTION_KEY="fake-encryption-key"
CHAPA_RETURN_URL="http://localhost:3000/api/v1/payment/verify"
CHAPA_CALLBACK_URL="http://localhost:3000/api/v1/payment/webhook"

# App Port (Docker Compose)
APP_PORT=3000
```

- [ ] **Step 2: Verify .env.example updated**

Run: `Get-Content .env.example | Select-String "CHAPA|CLOUDINARY|APP_PORT"`
Expected: shows Chapa, Cloudinary, and APP_PORT entries

---

### Task 6: Build and test the full stack

**Files:**

- No file changes

- [ ] **Step 1: Copy .env.example to .env (if .env missing)**

Run: `if (!(Test-Path .env)) { Copy-Item .env.example .env; Write-Host ".env created" } else { Write-Host ".env exists" }`
Expected: either ".env exists" or ".env created"

- [ ] **Step 2: Build and start containers**

Run: `docker compose up --build -d 2>&1 | Select-Object -Last 10`
Expected: both containers start, app container shows "healthy" or running

- [ ] **Step 3: Verify PostgreSQL is healthy**

Run: `docker compose exec postgres pg_isready -U postgres -d backend_db`
Expected: "accepting connections"

- [ ] **Step 4: Verify Prisma migrations ran**

Run: `docker compose logs app 2>&1 | Select-String "migrat|Running"`
Expected: shows "Running Prisma migrations" and no errors

- [ ] **Step 5: Verify app health check**

Run: `curl http://localhost:3000/api/health`
Expected: `{"success":true,"data":{"status":"UP","timestamp":"...","service":"ServiceHub Backend API"}}`

- [ ] **Step 6: Verify Prisma client can connect**

Run: `docker compose exec app node --import tsx -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('DB connected'); return p.\$disconnect(); })" 2>&1`
Expected: "DB connected"

- [ ] **Step 7: Stop containers**

Run: `docker compose down`
Expected: both containers stopped and removed

---

### Task 7: Commit

- [ ] **Step 1: Stage all changes**

Run: `git add Dockerfile docker-compose.yml docker-entrypoint.sh .dockerignore .env.example`
Expected: all files staged

- [ ] **Step 2: Commit**

Run: `git commit -m "feat: containerize backend (Node.js app + PostgreSQL)"`
Expected: commit succeeds

---

## Verification Checklist

After all tasks, verify:

1. `docker compose up --build` starts both app and PostgreSQL
2. Prisma migrations run automatically on first start
3. `GET /api/health` returns 200 with status UP
4. `docker compose down && docker compose up` restarts cleanly (no migration errors)
5. Data persists across restarts (postgres_data volume)
6. `.env` secrets are not baked into the Docker image
7. Tests still pass: `pnpm test` (outside Docker, unchanged)
