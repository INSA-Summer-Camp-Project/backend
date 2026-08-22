# syntax=docker/dockerfile:1

# ============================================================
# Base — installs pnpm via npm (exact version, bypasses corepack range check)
# ============================================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@11.21.0

WORKDIR /app


# ============================================================
# Dependencies — install all deps with BuildKit cache mount
# The pnpm content-addressable store is cached across rebuilds,
# so packages are only downloaded once, not on every `docker compose up --build`
# ============================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

ENV HUSKY=0

# --mount=type=cache persists the pnpm store between builds
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Copy src so prisma.config.ts can resolve ./src/config/env
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client (needs dummy env vars to pass Zod validation in prisma.config.ts)
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL \
    NODE_ENV=production \
    PORT=5000 \
    FRONTEND_URL=http://localhost:3000 \
    JWT_SECRET=dummy \
    JWT_ACCESS_EXPIRES_IN=15m \
    TELEGRAM_CLIENT_ID=dummy \
    TELEGRAM_CLIENT_SECRET=dummy \
    TELEGRAM_REDIRECT_URI=http://localhost:3000 \
    TELEGRAM_BOT_TOKEN=dummy \
    TELEGRAM_BOT_USERNAME=dummy \
    TELEGRAM_OIDC_COOKIE_SECRET=dummy12345678901234567890123456789012 \
    CLOUDINARY_URL=cloudinary://key:secret@cloud \
    CHAPA_SECRET_KEY=dummy \
    CHAPA_PUBLIC_KEY=dummy \
    CHAPA_ENCRYPTION_KEY=dummy12345678901234 \
    CHAPA_CALLBACK_URL=http://localhost:5000/webhook \
    CHAPA_RETURN_URL=http://localhost:3000/payment

RUN pnpm prisma generate


# ============================================================
# Production runner
# tsx runs TypeScript source directly — no separate compile step
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@11.21.0

RUN apk add --no-cache curl

# All node_modules (includes tsx for runtime)
COPY --from=deps /app/node_modules ./node_modules

# Prisma schema + generated client
COPY --from=deps /app/prisma ./prisma

# Source
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src/
COPY package.json ./

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Render.com injects PORT at runtime (default: 10000).
# Set PORT=10000 in your Render service environment variables.
EXPOSE 5000

ENTRYPOINT ["/docker-entrypoint.sh"]