#!/bin/bash
# ========================================
# Dev Environment — Start Script
# ========================================
# Usage: bash scripts/dev-start.sh [backend|frontend|db|seed|migrate|all]
# ========================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.dev"
DC_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEV]${NC} $1"; }
warn() { echo -e "${YELLOW}[DEV]${NC} $1"; }
info() { echo -e "${CYAN}[DEV]${NC} $1"; }

# Load .env.dev variables
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.dev not found at $ENV_FILE"
  exit 1
fi

# Export all variables from .env.dev
set -a
source "$ENV_FILE"
set +a

show_help() {
  echo ""
  info "🔧 Dev Environment Manager"
  echo ""
  echo "  Usage: bash scripts/dev-start.sh <command>"
  echo ""
  echo "  Commands:"
  echo "    db        Start dev PostgreSQL + Redis containers"
  echo "    db:stop   Stop dev containers"
  echo "    db:logs   Show dev container logs"
  echo "    migrate   Sync dev DB schema (prisma db push)"
  echo "    seed      Seed dev DB (full + service extras)"
  echo "    backend   Start backend API on :${API_PORT:-4001}"
  echo "    frontend  Start frontend on :${WEB_PORT:-4000}"
  echo "    all       Start everything (db + migrate + seed + backend)"
  echo "    status    Show running dev services"
  echo "    reset     Drop dev DB and recreate"
  echo ""
  echo "  Ports:"
  echo "    PostgreSQL  :${DB_PORT:-5434}  (prod :5432)"
  echo "    Redis       :${REDIS_PORT:-6380}  (prod :6379)"
  echo "    Backend     :${API_PORT:-4001}  (prod :3001)"
  echo "    Frontend    :${WEB_PORT:-4000}  (prod :3000)"
  echo ""
}

cmd_db() {
  log "Starting dev database containers..."
  docker compose -f "$DC_FILE" up -d
  log "Waiting for PostgreSQL to be ready..."
  until docker exec rezerwacje-db-dev pg_isready -U rezerwacje_dev -d rezerwacje_dev > /dev/null 2>&1; do
    sleep 1
  done
  log "✅ Dev PostgreSQL ready on port ${DB_PORT:-5434}"
  log "✅ Dev Redis ready on port ${REDIS_PORT:-6380}"
}

cmd_db_stop() {
  log "Stopping dev containers..."
  docker compose -f "$DC_FILE" down
  log "✅ Dev containers stopped"
}

cmd_db_logs() {
  docker compose -f "$DC_FILE" logs -f
}

cmd_migrate() {
  log "Syncing dev DB schema with prisma db push..."
  cd "$PROJECT_ROOT/apps/backend"
  # Use db push for dev — creates ALL tables from schema.prisma
  # (baseline migration is incomplete for fresh DBs)
  npx dotenv -e "$ENV_FILE" -- npx prisma db push --accept-data-loss
  npx dotenv -e "$ENV_FILE" -- npx prisma generate
  log "✅ Dev DB schema synced"

  # Also apply SQL functions from migration 0002
  log "Applying SQL functions..."
  PGPASSWORD="${DB_PASSWORD}" psql -h localhost -p "${DB_PORT:-5434}" -U "${DB_USER}" -d "${DB_NAME}" \
    -f "$PROJECT_ROOT/apps/backend/prisma/migrations/0002_queue_sql_functions/migration.sql" \
    2>/dev/null && log "✅ SQL functions applied" || warn "⚠️  SQL functions skipped (psql not available or already applied)"
}

cmd_seed() {
  log "Seeding dev database..."
  cd "$PROJECT_ROOT/apps/backend"
  npx dotenv -e "$ENV_FILE" -- npx tsx prisma/seed.ts
  log "Seeding service extras..."
  npx dotenv -e "$ENV_FILE" -- npx tsx prisma/seed-service-extras.ts
  log "✅ Dev DB seeded"
}

cmd_backend() {
  log "Starting backend on :${API_PORT:-4001}..."
  cd "$PROJECT_ROOT/apps/backend"
  npx dotenv -e "$ENV_FILE" -- npx tsx watch src/index.ts
}

cmd_frontend() {
  log "Starting frontend on :${WEB_PORT:-4000}..."
  log "API URL: ${NEXT_PUBLIC_API_URL}"
  cd "$PROJECT_ROOT/apps/frontend"
  PORT=${WEB_PORT:-4000} NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" npm run dev
}

cmd_all() {
  cmd_db
  cmd_migrate
  cmd_seed
  log ""
  log "========================================"
  log "✅ Dev environment ready!"
  log "========================================"
  info "Backend:  http://localhost:${API_PORT:-4001}"
  info "Frontend: http://localhost:${WEB_PORT:-4000}"
  info "API URL:  ${NEXT_PUBLIC_API_URL}"
  log "========================================"
  log ""
  log "Starting backend..."
  cmd_backend
}

cmd_status() {
  info "Docker containers:"
  docker compose -f "$DC_FILE" ps
  echo ""
  info "Port usage:"
  for port in ${DB_PORT:-5434} ${REDIS_PORT:-6380} ${API_PORT:-4001} ${WEB_PORT:-4000}; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      log "  :$port — PID $pid ($(ps -p $pid -o comm= 2>/dev/null || echo 'docker'))"
    else
      warn "  :$port — free"
    fi
  done
}

cmd_reset() {
  warn "⚠️  This will destroy the dev database!"
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f "$DC_FILE" down -v
    log "✅ Dev volumes removed"
    cmd_db
    cmd_migrate
    cmd_seed
    log "✅ Dev DB reset complete"
  fi
}

# ========================================
# Main
# ========================================
case "${1:-help}" in
  db)        cmd_db ;;
  db:stop)   cmd_db_stop ;;
  db:logs)   cmd_db_logs ;;
  migrate)   cmd_migrate ;;
  seed)      cmd_seed ;;
  backend)   cmd_backend ;;
  frontend)  cmd_frontend ;;
  all)       cmd_all ;;
  status)    cmd_status ;;
  reset)     cmd_reset ;;
  *)         show_help ;;
esac
