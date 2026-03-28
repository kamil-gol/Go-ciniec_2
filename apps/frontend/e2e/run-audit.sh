#!/usr/bin/env bash
# Uruchamia testy audytu UI/UX #3 z interaktywnym zapytaniem o hasło.
#
# Użycie:
#   ./e2e/run-audit.sh                    # pierwsze uruchomienie (tworzy baseline)
#   ./e2e/run-audit.sh --update-snapshots # aktualizacja baseline
#   ./e2e/run-audit.sh --headed           # z widoczną przeglądarką

set -euo pipefail
cd "$(dirname "$0")/.."

# --- Interaktywne pytanie o email i hasło ---
default_email="admin@gosciniecrodzinny.pl"
read -p "Email admina [${default_email}]: " email
email="${email:-$default_email}"

read -s -p "Hasło dla ${email}: " password
echo ""

if [ -z "$password" ]; then
  echo "❌ Hasło nie może być puste."
  exit 1
fi

# Wyczyść cached auth state (wymusi fresh login)
rm -f e2e/.auth-state.json

echo "🚀 Uruchamiam testy audytu UI/UX #3..."
echo "   Base URL: ${PLAYWRIGHT_TEST_BASE_URL:-http://localhost:4000}"
echo ""

# CORS wymaga tego samego origin co NEXT_PUBLIC_API_URL
# /etc/hosts na VPS: 127.0.0.1 dev.gosciniec.online (ruch lokalny)
export PLAYWRIGHT_TEST_BASE_URL="${PLAYWRIGHT_TEST_BASE_URL:-https://dev.gosciniec.online}"
# Export z single-quote ochroną przed interpretacją znaków specjalnych
export TEST_ADMIN_EMAIL="${email}"
export TEST_ADMIN_PASSWORD="${password}"

# Debug: pokaż długość hasła (nie treść)
echo "   Email: ${TEST_ADMIN_EMAIL}"
echo "   Password length: ${#TEST_ADMIN_PASSWORD} chars"

npx playwright test specs/13-uiux-audit3.spec.ts \
  --project=chromium \
  "$@"

echo ""
echo "📊 Raport HTML: npx playwright show-report"
