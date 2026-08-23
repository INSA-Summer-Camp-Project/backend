#!/bin/sh
set -e

echo "Applying Prisma migrations (non-destructive)..."
node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

echo "Generating Prisma client..."
node_modules/.bin/prisma generate --schema=prisma/schema.prisma

echo "Starting application..."
exec node --dns-result-order=ipv4first --import tsx/esm src/server.ts

