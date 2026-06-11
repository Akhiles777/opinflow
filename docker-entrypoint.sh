#!/bin/sh
set -e

echo "[startup] Applying database schema (prisma db push)..."
node /app/node_modules/prisma/build/index.js db push --skip-generate

echo "[startup] Schema applied. Starting Next.js..."
exec node server.js
