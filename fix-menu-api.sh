#!/bin/bash

# 🔧 Menu API Diagnostic & Repair Script
# Automatycznie diagnozuje i naprawia problemy z endpointami menu

set -e

echo ""
echo "==============================================="
echo "🔍 DIAGNOZOWANIE API MENU"
echo "==============================================="
echo ""

# Krok 1: Sprawdzenie czy kontenery działają
echo "➡️  Krok 1: Sprawdzanie statusów kontenerów..."
docker compose ps
echo ""

# Krok 2: Sprawdzenie logów backendu
echo "➡️  Krok 2: Sprawdzanie ostatnich logów backendu..."
echo "---------------------------------------------------"
docker compose logs --tail=50 backend
echo "---------------------------------------------------"
echo ""

# Krok 3: Test endpointu (podstawowy)
echo "➡️  Krok 3: Testowanie endpointu /api/menu-templates..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/menu-templates 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint działa! (HTTP $HTTP_CODE)"
  echo ""
  echo "🎉 Wszystko działa! Nie ma potrzeby naprawy."
  exit 0
else
  echo "❌ Endpoint nie działa (HTTP $HTTP_CODE)"
  echo ""
fi

echo "==============================================="
echo "🔨 NAPRAWA API MENU"
echo "==============================================="
echo ""

# Krok 4: Rebuild backendu
echo "➡️  Krok 4: Rebuild kontenera backend..."
echo "To może potrwać 2-3 minuty..."
docker compose build backend
echo ""

# Krok 5: Restart backendu
echo "➡️  Krok 5: Restart backendu..."
docker compose restart backend
echo ""

# Krok 6: Czekanie aż backend się uruchomi
echo "➡️  Krok 6: Czekanie na uruchomienie backendu (max 30s)..."
for i in {1..30}; do
  sleep 1
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend uruchomiony!"
    break
  fi
  
  echo -n "."
done
echo ""
echo ""

# Krok 7: Weryfikacja endpointów
echo "==============================================="
echo "✅ WERYFIKACJA ENDPOINTÓW MENU"
echo "==============================================="
echo ""

echo "Testowanie endpointów menu..."
echo ""

# Test 1: Menu templates
echo "1. GET /api/menu-templates"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/menu-templates 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ OK (HTTP $HTTP_CODE)"
else
  echo "   ❌ FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Menu options
echo "2. GET /api/menu-options"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/menu-options 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ OK (HTTP $HTTP_CODE)"
else
  echo "   ❌ FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Menu packages (przez template)
echo "3. GET /api/menu-packages/template/{templateId}"
echo "   ⏭️  Pominięto (wymaga ID)"
echo ""

# Test 4: Health check
echo "4. GET /api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ OK (HTTP $HTTP_CODE)"
else
  echo "   ❌ FAILED (HTTP $HTTP_CODE)"
fi
echo ""

echo "==============================================="
echo "🎉 NAPRAWA ZAKOŃCZONA!"
echo "==============================================="
echo ""
echo "Sprawdź frontend pod adresem: http://localhost:3000"
echo "API dokumentacja: http://localhost:3001/api/menu-templates"
echo ""
echo "Jeśli nadal występują problemy:"
echo "1. Sprawdź logi: docker compose logs -f backend"
echo "2. Sprawdź frontend console (F12)"
echo "3. Upewnij się że seed został uruchomiony:"
echo "   docker compose exec backend npm run db:seed:all-menu"
echo ""
