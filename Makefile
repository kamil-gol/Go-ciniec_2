# ========================================
# Makefile — Go-ciniec_2 Test Commands
# ========================================
# Użycie:
#   make test-unit          → unit testy backend (w Dockerze)
#   make test-integration   → integration testy backend (z bazą PostgreSQL)
#   make test-frontend      → component testy frontend (Vitest + RTL)
#   make test-e2e           → E2E testy (Playwright)
#   make test-all           → unit + integration + frontend
#   make test-coverage      → pełne pokrycie kodu
#   make test-down          → zatrzymaj kontenery testowe
#   make dev                → uruchom dev environment
# ========================================

.PHONY: test-unit test-integration test-frontend test-e2e test-all test-coverage test-down dev

# ========================================
# Development
# ========================================

dev:
	docker compose up -d

# ========================================
# Backend — Unit Tests
# ========================================

test-unit:
	docker compose -f docker-compose.test.yml run --rm \
		backend-test \
		sh -c "npx prisma generate && npm run test:unit"

# ========================================
# Backend — Integration Tests (z bazą)
# ========================================

test-integration:
	docker compose -f docker-compose.test.yml run --rm \
		backend-test \
		sh -c "npx prisma generate && npx prisma migrate deploy && npm run test:integration"

# ========================================
# Backend — Wszystkie testy z pokryciem
# ========================================

test-coverage:
	docker compose -f docker-compose.test.yml run --rm \
		backend-test \
		sh -c "npx prisma generate && npx prisma migrate deploy && npm run test:ci"

# ========================================
# Frontend — Component Tests (Vitest + RTL)
# ========================================

test-frontend:
	docker compose -f docker-compose.test.yml run --rm \
		frontend-test \
		npx vitest run --reporter=verbose

# ========================================
# Frontend — Component Tests z pokryciem
# ========================================

test-frontend-coverage:
	docker compose -f docker-compose.test.yml run --rm \
		frontend-test \
		npx vitest run --coverage --reporter=verbose

# ========================================
# Frontend — E2E Tests (Playwright)
# ========================================
# Wymaga uruchomionego dev environment (make dev)

test-e2e:
	cd apps/frontend && npx playwright test

test-e2e-ui:
	cd apps/frontend && npx playwright test --ui

test-e2e-headed:
	cd apps/frontend && npx playwright test --headed

# ========================================
# Wszystkie testy (unit + integration + frontend)
# ========================================

test-all: test-unit test-integration test-frontend

# ========================================
# Cleanup — zatrzymaj kontenery testowe
# ========================================

test-down:
	docker compose -f docker-compose.test.yml down -v --remove-orphans

# ========================================
# Pomoc
# ========================================

help:
	@echo ""
	@echo "  Go-ciniec_2 — Komendy testowe"
	@echo "  ════════════════════════════════════════"
	@echo ""
	@echo "  make test-unit              Unit testy backend (w Dockerze)"
	@echo "  make test-integration       Integration testy backend (z PostgreSQL)"
	@echo "  make test-frontend          Component testy frontend (Vitest + RTL)"
	@echo "  make test-coverage          Backend testy z pokryciem kodu"
	@echo "  make test-frontend-coverage Frontend testy z pokryciem kodu"
	@echo "  make test-e2e               E2E testy Playwright (wymaga make dev)"
	@echo "  make test-e2e-ui            E2E testy z UI Playwright"
	@echo "  make test-all               Wszystkie testy (unit+integration+frontend)"
	@echo "  make test-down              Zatrzymaj kontenery testowe"
	@echo "  make dev                    Uruchom dev environment"
	@echo ""
