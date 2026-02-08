#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== QUICK TEST: Utworzenie rezerwacji z poprawnymi danymi ==="

# Login
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gosciniecrodzinny.pl", "password": "admin123"}' | jq -r '.data.token')

# Pobierz IDs
IDS=$(docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje -t -c "
  SELECT 
    (SELECT id FROM \"Hall\" LIMIT 1),
    (SELECT id FROM \"Client\" LIMIT 1),
    (SELECT id FROM \"EventType\" WHERE name='Wesele' LIMIT 1);
" | head -1)

HALL_ID=$(echo $IDS | awk '{print $1}')
CLIENT_ID=$(echo $IDS | awk '{print $3}')
EVENT_ID=$(echo $IDS | awk '{print $5}')

# Test: 30 adults + 10 children = 40 guests (mieści się w capacity 50)
echo "Tworzenie rezerwacji: 30 adults + 10 children = 40 guests"
CREATE=$(curl -s -X POST $BASE_URL/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"hallId\": \"$HALL_ID\",
    \"clientId\": \"$CLIENT_ID\",
    \"eventTypeId\": \"$EVENT_ID\",
    \"startDateTime\": \"2027-09-20T17:00:00Z\",
    \"endDateTime\": \"2027-09-20T23:00:00Z\",
    \"adults\": 30,
    \"children\": 10,
    \"pricePerAdult\": 120,
    \"pricePerChild\": 80,
    \"notes\": \"Test API - naprawiony\"
  }")

echo "$CREATE" | jq '.'

if [ "$(echo $CREATE | jq -r '.success')" = "true" ]; then
  echo ""
  echo "✅ SUCCESS! Rezerwacja utworzona:"
  echo "$CREATE" | jq '.data | {
    id, 
    adults, 
    children, 
    guests, 
    pricePerAdult, 
    pricePerChild, 
    totalPrice,
    notes
  }'
  
  # Sprawdź obliczenia
  ADULTS=$(echo $CREATE | jq -r '.data.adults')
  CHILDREN=$(echo $CREATE | jq -r '.data.children')
  GUESTS=$(echo $CREATE | jq -r '.data.guests')
  TOTAL=$(echo $CREATE | jq -r '.data.totalPrice')
  
  echo ""
  echo "Weryfikacja obliczeń:"
  echo "  Adults: $ADULTS × 120 = $((ADULTS * 120))"
  echo "  Children: $CHILDREN × 80 = $((CHILDREN * 80))"
  echo "  Total guests: $GUESTS (powinno być $((ADULTS + CHILDREN)))"
  echo "  Total price: $TOTAL (powinno być $((ADULTS * 120 + CHILDREN * 80)))"
else
  echo "❌ FAIL: $(echo $CREATE | jq -r '.error')"
fi
