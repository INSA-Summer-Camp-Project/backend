# syntax=docker/dockerfile:1

# ============================================================
# Base
# ============================================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app


# ============================================================
# Development dependencies
# ============================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

ENV HUSKY=0

RUN pnpm install --frozen-lockfile --ignore-scripts


# ============================================================
# Builder
# ============================================================
FROM deps AS builder

COPY tsconfig.json ./
COPY src ./src/

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

ENV DATABASE_URL=$DATABASE_URL

ENV JWT_SECRET=dummy \
    TELEGRAM_CLIENT_ID=dummy \
    TELEGRAM_CLIENT_SECRET=dummy \
    TELEGRAM_REDIRECT_URI=dummy \
    TELEGRAM_BOT_TOKEN=dummy \
    TELEGRAM_OIDC_COOKIE_SECRET=dummy12345678901234567890123456789012

RUN pnpm prisma generate

RUN pnpm build


# ============================================================
# Production dependencies
# ============================================================
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./

ENV HUSKY=0

RUN pnpm install \
    --prod \
    --frozen-lockfile \
    --ignore-scripts


# ============================================================
# Production runner
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache curl

# Production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Prisma schema/config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Compiled application
COPY --from=builder /app/dist ./dist

# Generated Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Package metadata
COPY --from=builder /app/package.json ./

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/docker-entrypoint.sh"]