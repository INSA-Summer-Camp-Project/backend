# ---- builder stage ----
FROM node:22-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY src ./src/
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ---- runner stage ----
FROM node:22-alpine AS runner
RUN npm install -g pnpm tsx
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json ./
COPY src ./src/
RUN pnpm prune --prod && pnpm add prisma @prisma/adapter-pg @prisma/client

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
