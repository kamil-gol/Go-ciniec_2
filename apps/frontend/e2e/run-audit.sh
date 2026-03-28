#!/usr/bin/env bash
# Uruchamia testy audytu UI/UX #3 z interaktywnym zapytaniem o hasło.
#
# Użycie:
#   ./e2e/run-audit.sh                    # pierwsze uruchomienie (tworzy baseline)
#   ./e2e/run-audit.sh --update-snapshots # aktualizacja baseline
#   ./e2e/run-audit.sh --headed           # z widoczną przeglądarką

set -euo pipefail
cd "$(dirname "$0")/.."

# --- Interaktywne pytanie o hasło ---
read -s -p "Podaj hasło admina (admin@gosciniecrodzinny.pl): " password
echo ""

if [ -z "$password" ]; then
  echo "❌ Hasło nie może być puste."
  exit 1
fi

echo "🚀 Uruchamiam testy audytu UI/UX #3..."
echo "   Base URL: ${PLAYWRIGHT_TEST_BASE_URL:-https://dev.gosciniec.online}"
echo ""

export PLAYWRIGHT_TEST_BASE_URL="${PLAYWRIGHT_TEST_BASE_URL:-https://dev.gosciniec.online}"
export TEST_ADMIN_PASSWORD="$password"

npx playwright test specs/13-uiux-audit3.spec.ts \
  --project=chromium \
  "$@"

echo ""
echo "📊 Raport HTML: npx playwright show-report"
