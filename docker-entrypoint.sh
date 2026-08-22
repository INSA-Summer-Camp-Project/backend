#!/bin/sh
set -e

echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

echo "Starting application..."
exec node --dns-result-order=ipv4first --import tsx/esm src/server.ts
