#!/bin/bash
# ============================================================
# Fix all 50 failing test assertions: English → Polish i18n
# Run from: apps/backend/
# Usage: bash fix-i18n-tests.sh
# ============================================================
set -e

echo "🔧 Fixing i18n test assertions (EN→PL)..."

BASE="src/tests/unit"

# ──────────────────────────────────────────────────────────
# 1. reservation.service.branches3.test.ts (3 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/reservation.service.branches3.test.ts"
sed -i "s|.toThrow('Client not found')|.toThrow('Nie znaleziono klienta')|g" "$F"
sed -i "s|.toThrow('at least 100 guests')|.toThrow('wymaga minimum 100')|g" "$F"
sed -i "s|.toThrow('maximum 30 guests')|.toThrow('pozwala na maksimum 30')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 2. discount.service.branches.test.ts (2 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/discount.service.branches.test.ts"
sed -i "s|.toThrow('not found')|.toThrow('Nie znaleziono rezerwacji')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 3. discount.service.test.ts (2 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/discount.service.test.ts"
sed -i "s|.toThrow(/not found/)|.toThrow(/Nie znaleziono rezerwacji/)|g" "$F"
# fallback: if it uses string instead of regex
sed -i "s|.toThrow('not found')|.toThrow('Nie znaleziono rezerwacji')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 4. reports.service.branches.test.ts (1 fix)
# ──────────────────────────────────────────────────────────
F="$BASE/services/reports.service.branches.test.ts"
sed -i "s|.toBe('N/A')|.toBe('Brak danych')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 5. reports.service.test.ts (1 fix)
# ──────────────────────────────────────────────────────────
F="$BASE/services/reports.service.test.ts"
sed -i "s|.toBe('N/A')|.toBe('Brak danych')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 6. reservation-menu.service.branches2.test.ts (1 fix)
# ──────────────────────────────────────────────────────────
F="$BASE/services/reservation-menu.service.branches2.test.ts"
sed -i "s|.toThrow('Menu not selected for this reservation')|.toThrow('Menu nie zostało wybrane dla tej rezerwacji')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 7. packageCategory.service.test.ts (5 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/packageCategory.service.test.ts"
sed -i "s|.toThrow('Category setting not found')|.toThrow('Nie znaleziono ustawień kategorii')|g" "$F"
sed -i "s|.toThrow(/already exists/)|.toThrow(/już istnieją/)|g" "$F"
sed -i "s|.toThrow('Package not found')|.toThrow('Nie znaleziono pakietu menu')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 8. packageCategory.service.branches.test.ts (5 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/packageCategory.service.branches.test.ts"
sed -i "s|.toThrow('not found')|.toThrow('Nie znaleziono')|g" "$F"
sed -i "s|.toThrow('already exists')|.toThrow('już istnieją')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 9. menuCourse.service.test.ts (6 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/menuCourse.service.test.ts"
sed -i "s|.toThrow('Course not found')|.toThrow('Nie znaleziono kursu menu')|g" "$F"
sed -i "s|.toThrow('Package not found')|.toThrow('Nie znaleziono pakietu menu')|g" "$F"
sed -i "s|.toThrow(/Dishes not found.*dish-missing/)|.toThrow(/Nie znaleziono dań.*dish-missing/)|g" "$F"
# fallback for string version
sed -i "s|.toThrow('Dishes not found')|.toThrow('Nie znaleziono dań')|g" "$F"
sed -i "s|.toThrow('Dish not assigned to this course')|.toThrow('Danie nie jest przypisane do tego kursu')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 10. menuCourse.service.branches2.test.ts (2 fixes)
# ──────────────────────────────────────────────────────────
F="$BASE/services/menuCourse.service.branches2.test.ts"
sed -i "s|.toThrow('Course not found')|.toThrow('Nie znaleziono kursu menu')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 11. roles.test.ts (2 fixes) — middlewares
# ──────────────────────────────────────────────────────────
F="$BASE/middlewares/roles.test.ts"
sed -i "s|error: 'Insufficient permissions'|error: 'Niewystarczające uprawnienia'|g" "$F"
sed -i "s|error: 'Authentication required'|error: 'Wymagane uwierzytelnienie'|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 12. validateUUID.test.ts (3 fixes) — middlewares
# ──────────────────────────────────────────────────────────
F="$BASE/middlewares/validateUUID.test.ts"
sed -i "s|error: \"Invalid ID format for parameter 'id'\"|error: 'Nieprawidłowy format identyfikatora: id'|g" "$F"
sed -i "s|error: \"Invalid ID format for parameter 'itemId'\"|error: 'Nieprawidłowy format identyfikatora: itemId'|g" "$F"
# Also handle single-quote variant
sed -i "s|error: 'Invalid ID format for parameter.*id.*'|error: 'Nieprawidłowy format identyfikatora: id'|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 13. errorHandler.branches2.test.ts (2 fixes) — middlewares
# ──────────────────────────────────────────────────────────
F="$BASE/middlewares/errorHandler.branches2.test.ts"
sed -i "s|error: 'Invalid data provided'|error: 'Podano nieprawidłowe dane'|g" "$F"
sed -i "s|error: 'Internal server error'|error: 'Wewnętrzny błąd serwera'|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 14. auth.middleware.extra.test.ts (1 fix) — middlewares
# ──────────────────────────────────────────────────────────
F="$BASE/middlewares/auth.middleware.extra.test.ts"
sed -i "s|.toBe('Authentication failed')|.toBe('Uwierzytelnienie nie powiodło się')|g" "$F"
echo "  ✅ $F"

# ──────────────────────────────────────────────────────────
# 15. email.service.test.ts (2 fixes — env/logic)
#     - SMTP_FROM fallback: test expects env SMTP_USER but app uses real SMTP_FROM from .env
#     - verify() returns true: test expects false when no config but env provides config
#     These are env-dependent issues. We skip them as they need manual investigation.
# ──────────────────────────────────────────────────────────
echo "  ⚠️  email.service.test.ts — wymaga ręcznej analizy (env-dependent, nie i18n)"

# ──────────────────────────────────────────────────────────
# 16. auth.controller.test.ts (1 fix — validatePassword import)
#     TypeError: validatePassword is not a function
#     This is a structural issue (named export changed), not i18n.
# ──────────────────────────────────────────────────────────
echo "  ⚠️  auth.controller.test.ts — wymaga ręcznej analizy (validatePassword export change)"

echo ""
echo "✅ Done! Fixed ~46/50 failing assertions (i18n EN→PL)."
echo "⚠️  2 files need manual review: email.service.test.ts, auth.controller.test.ts"
echo ""
echo "Next steps:"
echo "  1. npm run test:unit"
echo "  2. git add -A && git commit -m 'fix: update test assertions to Polish i18n strings'"
