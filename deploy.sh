#!/bin/bash
set -e

cd /opt/opinflow
git pull origin main

export $(grep -E '^NEXT_PUBLIC_' .env.production | xargs)

docker build \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$NEXT_PUBLIC_VAPID_PUBLIC_KEY" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -t opinflow:latest .

docker run --rm --env-file .env.production opinflow:latest \
  sh -c "npx prisma db push"

docker-compose down
docker-compose up -d

echo "Деплой завершён"
