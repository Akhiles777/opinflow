#!/bin/bash
set -euo pipefail

APP_DIR="/opt/opinflow"
IMAGE="opinflow"
BACKUP_DIR="$APP_DIR/backups"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

cd "$APP_DIR"

# ── [1/5] Получаем последний код ──────────────────────────────────────────────
log "=== [1/5] Получаем последний код ==="
git pull origin main

# ── [2/5] Резервная копия БД ──────────────────────────────────────────────────
log "=== [2/5] Резервная копия базы данных ==="
mkdir -p "$BACKUP_DIR"
POSTGRES_ID=$(docker compose ps -q postgres 2>/dev/null || true)
BACKUP_FILE=""
if [ -n "$POSTGRES_ID" ]; then
  BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
  docker exec "$POSTGRES_ID" pg_dump -U opinflow opinflow | gzip > "$BACKUP_FILE"
  log "Бэкап сохранён: $BACKUP_FILE"
  # Удаляем бэкапы старше 30 дней
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
else
  log "Postgres не запущен — бэкап пропущен (первый деплой?)"
fi

# ── [3/5] Сборка Docker-образа ────────────────────────────────────────────────
log "=== [3/5] Сборка Docker-образа ==="
set -o allexport
# shellcheck disable=SC1091
source "$APP_DIR/.env.production"
set +o allexport

GIT_SHA=$(git rev-parse --short HEAD)

docker build \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-}" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" \
  --build-arg NEXT_PUBLIC_COMMISSION_RATE="${NEXT_PUBLIC_COMMISSION_RATE:-15}" \
  --label "git-sha=$GIT_SHA" \
  --label "build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -t "$IMAGE:latest" \
  -t "$IMAGE:$GIT_SHA" \
  .

# ── [4/5] Запускаем postgres + применяем схему ────────────────────────────────
log "=== [4/5] Запуск postgres и применение схемы ==="
docker compose up -d postgres
log "Ожидаем готовности postgres..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U opinflow -q 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  [ $RETRIES -le 0 ] && die "Postgres не запустился за 60 секунд"
  sleep 2
done
log "Postgres готов"

# Применяем схему БД (без --accept-data-loss — безопасно)
log "Применяем схему базы данных..."
docker compose run --rm --no-deps app \
  node /app/node_modules/prisma/build/index.js db push --skip-generate \
  || {
    log "ERROR: Миграция схемы завершилась с ошибкой!"
    [ -n "$BACKUP_FILE" ] && log "Для восстановления: zcat $BACKUP_FILE | docker exec -i \$(docker compose ps -q postgres) psql -U opinflow opinflow"
    exit 1
  }
log "Схема БД обновлена"

# ── [5/5] Перезапускаем приложение ───────────────────────────────────────────
log "=== [5/5] Перезапускаем приложение ==="
docker compose up -d --no-deps app

log ""
log "=== Деплой завершён! ==="
log "Образ: $IMAGE:$GIT_SHA"
[ -n "$BACKUP_FILE" ] && log "Бэкап: $BACKUP_FILE"
log "Логи: docker compose logs -f app"
