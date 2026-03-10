#!/usr/bin/env bash
# =============================================================================
# test-dnd-api.sh — Autonomiczny test endpointów DnD (sekcje + opcje)
# Repo: kamil-gol/Go-ciniec_2  |  PR #201  |  feature/catering-dnd-sections
#
# Uruchomienie:
#   chmod +x scripts/test-dnd-api.sh && ./scripts/test-dnd-api.sh
#
# Wymagania: curl, jq
# =============================================================================

set -euo pipefail

BASE="http://localhost:4001/api"
EMAIL="admin@gosciniecrodzinny.pl"
read -s -p "Podaj haslo dla admin@gosciniecrodzinny.pl: " PASSWORD && echo

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC} $1"; }
fail() { echo -e "${RED}✗ FAIL${NC} $1"; }
info() { echo -e "${BLUE}▶${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  DnD API Test — PR #201                        ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# ──────────────────────────────────────────────────────────────────
# 1. LOGIN → TOKEN
# ──────────────────────────────────────────────────────────────────
info "Logowanie jako $EMAIL ..."

LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESP" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESP" | head -n -1)

if [ "$HTTP_CODE" != "200" ]; then
  fail "Login zwrócił HTTP $HTTP_CODE"
  echo "$LOGIN_BODY" | jq . 2>/dev/null || echo "$LOGIN_BODY"
  exit 1
fi

TOKEN=$(echo "$LOGIN_BODY" | jq -r '.accessToken')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  fail "Brak accessToken w odpowiedzi"
  echo "$LOGIN_BODY" | jq .
  exit 1
fi

pass "Login OK | token: ${TOKEN:0:20}..."

AUTH="Authorization: Bearer $TOKEN"

# ──────────────────────────────────────────────────────────────────
# 2. POBIERZ PIERWSZY TEMPLATE Z SEKCJAMI
# ──────────────────────────────────────────────────────────────────
info "Pobieranie listy templateów..."

TEMPLATES=$(curl -s "$BASE/catering/templates" -H "$AUTH")
TEMPLATE_COUNT=$(echo "$TEMPLATES" | jq '.data | length')

if [ "$TEMPLATE_COUNT" -eq "0" ]; then
  warn "Brak templateów w bazie — nie można przetestować DnD"
  exit 0
fi

TEMPLATE_ID=$(echo "$TEMPLATES" | jq -r '.data[0].id')
TEMPLATE_NAME=$(echo "$TEMPLATES" | jq -r '.data[0].name')
pass "Template: \"$TEMPLATE_NAME\" ($TEMPLATE_ID)"

# ──────────────────────────────────────────────────────────────────
# 3. POBIERZ TEMPLATE Z PAKIETAMI I SEKCJAMI
# ──────────────────────────────────────────────────────────────────
info "Pobieranie szczegółów template z pakietami/sekcjami..."

TEMPLATE_DETAIL=$(curl -s "$BASE/catering/templates/$TEMPLATE_ID" -H "$AUTH")

PACKAGE_COUNT=$(echo "$TEMPLATE_DETAIL" | jq '.data.packages | length')
if [ "$PACKAGE_COUNT" -eq "0" ]; then
  warn "Template nie ma pakietów — nie można przetestować DnD sekcji"
  exit 0
fi

# Znajdź pakiet, który ma przynajmniej 2 sekcje
PACKAGE_IDX=$(echo "$TEMPLATE_DETAIL" | jq '[.data.packages[] | select((.sections | length) >= 2)] | if length > 0 then .[0] else null end | if . then (.displayOrder // 0) else null end' 2>/dev/null || echo "null")

# Prosta metoda: znajdź indeks pierwszego pakietu z >= 2 sekcjami
PACKAGE_JSON=$(echo "$TEMPLATE_DETAIL" | jq '.data.packages[] | select((.sections | length) >= 2)' | jq -s '.[0]')

if [ "$PACKAGE_JSON" = "null" ] || [ -z "$PACKAGE_JSON" ]; then
  warn "Brak pakietu z >= 2 sekcjami. Spróbuję na pierwszym pakiecie z jakąkolwiek sekcją..."
  PACKAGE_JSON=$(echo "$TEMPLATE_DETAIL" | jq '.data.packages[] | select((.sections | length) >= 1)' | jq -s '.[0]')
fi

if [ "$PACKAGE_JSON" = "null" ] || [ -z "$PACKAGE_JSON" ]; then
  warn "Brak sekcji w jakimkolwiek pakiecie — test sekcji pominięty"
else
  PACKAGE_ID=$(echo "$PACKAGE_JSON" | jq -r '.id')
  PACKAGE_NAME=$(echo "$PACKAGE_JSON" | jq -r '.name')
  SECTION_COUNT=$(echo "$PACKAGE_JSON" | jq '.sections | length')
  pass "Pakiet: \"$PACKAGE_NAME\" ($PACKAGE_ID) | sekcji: $SECTION_COUNT"

  # ──────────────────────────────────────────────────────────────────
  # 4. TEST PATCH SEKCJI — displayOrder
  # ──────────────────────────────────────────────────────────────────
  SECTION_ID=$(echo "$PACKAGE_JSON" | jq -r '.sections[0].id')
  SECTION_NAME=$(echo "$PACKAGE_JSON" | jq -r '.sections[0].name // .sections[0].category.name // "Sekcja"')
  ORIG_ORDER=$(echo "$PACKAGE_JSON" | jq -r '.sections[0].displayOrder')
  NEW_ORDER=$(( ORIG_ORDER + 10 ))

  info "TEST 1: PATCH sekcji \"$SECTION_NAME\" — displayOrder $ORIG_ORDER → $NEW_ORDER"

  PATCH_RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/catering/sections/$SECTION_ID" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "{\"displayOrder\":$NEW_ORDER}")

  PATCH_CODE=$(echo "$PATCH_RESP" | tail -n1)
  PATCH_BODY=$(echo "$PATCH_RESP" | head -n -1)
  RETURNED_ORDER=$(echo "$PATCH_BODY" | jq -r '.data.displayOrder // "brak"')

  if [ "$PATCH_CODE" = "200" ] && [ "$RETURNED_ORDER" = "$NEW_ORDER" ]; then
    pass "PATCH sekcji OK | displayOrder w odpowiedzi: $RETURNED_ORDER"
  elif [ "$PATCH_CODE" = "200" ] && [ "$RETURNED_ORDER" != "$NEW_ORDER" ]; then
    fail "PATCH sekcji HTTP 200 ale displayOrder w odpowiedzi = $RETURNED_ORDER (oczekiwano $NEW_ORDER)"
    echo "$PATCH_BODY" | jq .
  else
    fail "PATCH sekcji zwrócił HTTP $PATCH_CODE"
    echo "$PATCH_BODY" | jq . 2>/dev/null || echo "$PATCH_BODY"
  fi

  # Przywroć oryginalny order
  curl -s -X PATCH "$BASE/catering/sections/$SECTION_ID" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "{\"displayOrder\":$ORIG_ORDER}" > /dev/null
  info "Przywrócono displayOrder sekcji do $ORIG_ORDER"

  # ──────────────────────────────────────────────────────────────────
  # 5. TEST PATCH OPCJI (DAŃ) — displayOrder
  # ──────────────────────────────────────────────────────────────────
  OPTION_JSON=$(echo "$PACKAGE_JSON" | jq '[.sections[].options // [] | .[]] | .[0]')

  if [ "$OPTION_JSON" = "null" ] || [ -z "$OPTION_JSON" ]; then
    warn "Brak opcji (dań) w sekcjach — test opcji pominięty"
  else
    OPTION_ID=$(echo "$OPTION_JSON" | jq -r '.id')
    ORIG_OPT_ORDER=$(echo "$OPTION_JSON" | jq -r '.displayOrder')
    NEW_OPT_ORDER=$(( ORIG_OPT_ORDER + 10 ))

    info "TEST 2: PATCH opcji ($OPTION_ID) — displayOrder $ORIG_OPT_ORDER → $NEW_OPT_ORDER"

    OPT_PATCH_RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/catering/options/$OPTION_ID" \
      -H "Content-Type: application/json" \
      -H "$AUTH" \
      -d "{\"displayOrder\":$NEW_OPT_ORDER}")

    OPT_CODE=$(echo "$OPT_PATCH_RESP" | tail -n1)
    OPT_BODY=$(echo "$OPT_PATCH_RESP" | head -n -1)
    OPT_RETURNED=$(echo "$OPT_BODY" | jq -r '.data.displayOrder // "brak"')

    if [ "$OPT_CODE" = "200" ] && [ "$OPT_RETURNED" = "$NEW_OPT_ORDER" ]; then
      pass "PATCH opcji OK | displayOrder w odpowiedzi: $OPT_RETURNED"
    elif [ "$OPT_CODE" = "200" ] && [ "$OPT_RETURNED" != "$NEW_OPT_ORDER" ]; then
      fail "PATCH opcji HTTP 200 ale displayOrder = $OPT_RETURNED (oczekiwano $NEW_OPT_ORDER)"
      echo "$OPT_BODY" | jq .
    else
      fail "PATCH opcji zwrócił HTTP $OPT_CODE"
      echo "$OPT_BODY" | jq . 2>/dev/null || echo "$OPT_BODY"
    fi

    # Przywroć oryginalny order
    curl -s -X PATCH "$BASE/catering/options/$OPTION_ID" \
      -H "Content-Type: application/json" \
      -H "$AUTH" \
      -d "{\"displayOrder\":$ORIG_OPT_ORDER}" > /dev/null
    info "Przywrócono displayOrder opcji do $ORIG_OPT_ORDER"
  fi
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  Testy zakończone                              ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
