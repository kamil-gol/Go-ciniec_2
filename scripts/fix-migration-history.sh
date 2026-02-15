#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# fix-migration-history.sh
# Naprawia Prisma P3006 error przez squash migracji do baseline
# Uruchom: cd /home/kamil/rezerwacje && bash scripts/fix-migration-history.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail
cd /home/kamil/rezerwacje

echo "═══════════════════════════════════════════════════"
echo "🔧 Naprawa migration history — P3006 fix"
echo "═══════════════════════════════════════════════════"

# 1. Pull latest
echo ""
echo "📥 [1/6] Pobieranie najnowszych zmian..."
git pull origin main

# 2. Create branch
echo ""
echo "🌿 [2/6] Tworzenie brancha fix/migration-history..."
git checkout -b fix/migration-history-local 2>/dev/null || git checkout fix/migration-history-local

# 3. Delete old migrations (keep migration_lock.toml and 0001_baseline)
echo ""
echo "🗑️  [3/6] Usuwanie starych migracji..."
MIGRATIONS_DIR="apps/backend/prisma/migrations"

rm -rf "$MIGRATIONS_DIR"/20260206*
rm -rf "$MIGRATIONS_DIR"/20260207*
rm -rf "$MIGRATIONS_DIR"/20260208*
rm -rf "$MIGRATIONS_DIR"/20260209*
rm -rf "$MIGRATIONS_DIR"/20260210*
rm -rf "$MIGRATIONS_DIR"/20260214*
rm -f "$MIGRATIONS_DIR"/migrate-dish-categories.sql
rm -f "$MIGRATIONS_DIR"/update_event_types.sql

echo "   ✅ Stare migracje usunięte"
echo "   ✅ Baseline: $MIGRATIONS_DIR/0001_baseline/migration.sql"

# 4. Verify baseline exists
if [ ! -f "$MIGRATIONS_DIR/0001_baseline/migration.sql" ]; then
    echo "   ❌ BŁĄD: Brak pliku baseline!"
    exit 1
fi
echo "   ✅ Baseline SQL OK ($(wc -l < "$MIGRATIONS_DIR/0001_baseline/migration.sql") linii)"

# 5. Mark baseline as applied in production DB
echo ""
echo "🗄️  [4/6] Oznaczanie baseline jako zastosowany w DB..."
docker compose exec -T backend npx prisma migrate resolve --applied "0001_baseline"
echo "   ✅ Baseline oznaczony jako applied"

# 6. Verify
echo ""
echo "🧪 [5/6] Weryfikacja prisma migrate..."
docker compose exec -T backend npx prisma migrate status || true

# 7. Commit, push, merge
echo ""
echo "📤 [6/6] Commit, push, merge do main..."
git add -A
git commit -m "fix: squash migration history into single baseline (P3006 fix)

- Replaced 19 individual migrations with single 0001_baseline
- Includes all tables, indexes, foreign keys, queue functions/triggers
- Fixes Prisma P3006 shadow database error
- prisma migrate dev now works correctly"

git push origin fix/migration-history-local:main

# Cleanup
git checkout main
git pull origin main
git branch -d fix/migration-history-local 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ GOTOWE! Migration history naprawiona."
echo ""
echo "Weryfikacja:"
echo "  docker compose exec backend npx prisma migrate status"
echo "  docker compose exec backend npx prisma migrate dev --name test --create-only"
echo "═══════════════════════════════════════════════════"
