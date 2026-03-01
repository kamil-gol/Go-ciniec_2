# ============================================
# Makefile — Go-ciniec_2
# ============================================
# Development:   make dev
# Production:    make prod
# Testing:       make test-unit / test-integration / test-all
# Storage:       make migrate-minio / minio-stats
# Cleanup:       make down / test-down
# ============================================

.PHONY: dev dev-build dev-down prod prod-build prod-down \
        test-unit test-integration test-frontend test-e2e test-all \
        test-coverage test-frontend-coverage test-down \
        migrate-minio migrate-minio-dry minio-stats minio-ls \
        logs logs-backend logs-frontend status help

# ============================================
# Compose file combinations
# ============================================
COMPOSE_DEV  = docker compose -p rezerwacje-dev -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker compose -p rezerwacje-prod -f docker-compose.yml -f docker-compose.prod.yml
COMPOSE_TEST = docker compose -f docker-compose.test.yml -p rezerwacje-test

# ============================================
# Development
# ============================================

dev:
	$(COMPOSE_DEV) --env-file .env.dev up

dev-build:
	$(COMPOSE_DEV) --env-file .env.dev up --build

dev-down:
	$(COMPOSE_DEV) --env-file .env.dev down

# ============================================
# Production
# ============================================

prod:
	$(COMPOSE_PROD) --env-file .env.prod up -d

prod-build:
	$(COMPOSE_PROD) --env-file .env.prod up -d --build

prod-down:
	$(COMPOSE_PROD) --env-file .env.prod down

# ============================================
# Testing (isolated, no .env file needed)
# ============================================

test-unit:
	$(COMPOSE_TEST) run --rm \
		backend-test \
		sh -c "npx prisma generate && npm run test:unit"

test-integration:
	$(COMPOSE_TEST) run --rm \
		backend-test \
		sh -c "npx prisma generate && npx prisma db push --force-reset --accept-data-loss && npm run test:integration"

test-coverage:
	$(COMPOSE_TEST) run --rm \
		backend-test \
		sh -c "npx prisma generate && npx prisma db push --force-reset --accept-data-loss && npm run test:ci"

test-frontend:
	$(COMPOSE_TEST) run --rm \
		frontend-test \
		npx vitest run --reporter=verbose

test-frontend-coverage:
	$(COMPOSE_TEST) run --rm \
		frontend-test \
		npx vitest run --coverage --reporter=verbose

test-e2e:
	cd apps/frontend && npx playwright test

test-e2e-ui:
	cd apps/frontend && npx playwright test --ui

test-e2e-headed:
	cd apps/frontend && npx playwright test --headed

test-all: test-unit test-integration test-frontend

test-down:
	$(COMPOSE_TEST) down -v --remove-orphans

# ============================================
# Storage / MinIO (#146)
# ============================================

migrate-minio:
	@echo "\n=== Migracja plików: local -> MinIO ==="
	$(COMPOSE_DEV) --env-file .env.dev exec backend \
		sh -c "STORAGE_DRIVER=minio npx tsx src/scripts/migrate-to-minio.ts"

migrate-minio-dry:
	@echo "\n=== Migracja plików: DRY RUN ==="
	$(COMPOSE_DEV) --env-file .env.dev exec backend \
		sh -c "STORAGE_DRIVER=minio DRY_RUN=true npx tsx src/scripts/migrate-to-minio.ts"

minio-ls:
	@$(COMPOSE_DEV) --env-file .env.dev exec minio \
		sh -c "mc alias set local http://localhost:9000 \$$MINIO_ROOT_USER \$$MINIO_ROOT_PASSWORD >/dev/null 2>&1 && mc ls local/attachments/ --recursive"

minio-stats:
	@echo "\n=== MinIO Bucket Stats ==="
	@$(COMPOSE_DEV) --env-file .env.dev exec minio \
		sh -c "mc alias set local http://localhost:9000 \$$MINIO_ROOT_USER \$$MINIO_ROOT_PASSWORD >/dev/null 2>&1 && mc du local/attachments/"

# ============================================
# Logs & Status
# ============================================

logs:
	$(COMPOSE_DEV) --env-file .env.dev logs -f

logs-backend:
	$(COMPOSE_DEV) --env-file .env.dev logs -f backend

logs-frontend:
	$(COMPOSE_DEV) --env-file .env.dev logs -f frontend

logs-minio:
	$(COMPOSE_DEV) --env-file .env.dev logs -f minio

logs-prod:
	$(COMPOSE_PROD) --env-file .env.prod logs -f

logs-prod-backend:
	$(COMPOSE_PROD) --env-file .env.prod logs -f backend

status:
	@echo "\n=== PROD ==="
	@$(COMPOSE_PROD) --env-file .env.prod ps 2>/dev/null || echo "  (not running)"
	@echo "\n=== DEV ==="
	@$(COMPOSE_DEV) --env-file .env.dev ps 2>/dev/null || echo "  (not running)"
	@echo ""

# ============================================
# Full Cleanup
# ============================================

down:
	$(COMPOSE_DEV) --env-file .env.dev down -v --remove-orphans 2>/dev/null || true
	$(COMPOSE_PROD) --env-file .env.prod down -v --remove-orphans 2>/dev/null || true
	$(COMPOSE_TEST) down -v --remove-orphans 2>/dev/null || true

# ============================================
# Help
# ============================================

help:
	@echo ""
	@echo "  Go-ciniec_2 — Docker Commands"
	@echo "  ============================================"
	@echo ""
	@echo "  DEVELOPMENT (ports 4000/4001):"
	@echo "    make dev                Start dev environment (hot-reload)"
	@echo "    make dev-build          Rebuild & start dev environment"
	@echo "    make dev-down           Stop dev environment"
	@echo ""
	@echo "  PRODUCTION (ports 3000/3001):"
	@echo "    make prod               Start production (detached)"
	@echo "    make prod-build         Rebuild & start production"
	@echo "    make prod-down          Stop production"
	@echo ""
	@echo "  TESTING:"
	@echo "    make test-unit          Backend unit tests"
	@echo "    make test-integration   Backend integration tests (with DB)"
	@echo "    make test-frontend      Frontend component tests (Vitest)"
	@echo "    make test-coverage      Backend tests with coverage"
	@echo "    make test-e2e           E2E tests (Playwright, needs make dev)"
	@echo "    make test-all           All tests (unit + integration + frontend)"
	@echo "    make test-down          Stop test containers"
	@echo ""
	@echo "  STORAGE / MINIO (#146):"
	@echo "    make migrate-minio      Migrate files: local -> MinIO"
	@echo "    make migrate-minio-dry  Dry run migration (no upload)"
	@echo "    make minio-ls           List all files in MinIO"
	@echo "    make minio-stats        Show bucket size/count"
	@echo ""
	@echo "  UTILITIES:"
	@echo "    make logs               Follow all logs (dev)"
	@echo "    make logs-backend       Follow backend logs (dev)"
	@echo "    make logs-minio         Follow MinIO logs (dev)"
	@echo "    make logs-prod          Follow all logs (prod)"
	@echo "    make logs-prod-backend  Follow backend logs (prod)"
	@echo "    make status             Show running containers (both envs)"
	@echo "    make down               Stop everything & cleanup"
	@echo ""
