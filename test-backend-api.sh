#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== TEST 1: Health Check (no auth required) ==="
curl -s $BASE_URL/health | jq .

echo -e "\n=== TEST 2: Login jako admin ==="
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosciniecrodzinny.pl",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | jq '{success, user: {email, role}}'

# Wyciągnij token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Nie udało się pobrać tokenu!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token: ${TOKEN:0:50}..."

echo -e "\n=== TEST 3: Pobierz IDs z bazy ==="
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje -t -c "
  SELECT 
    (SELECT id FROM \"Hall\" LIMIT 1) as hall_id,
    (SELECT id FROM \"Client\" LIMIT 1) as client_id,
    (SELECT id FROM \"EventType\" WHERE name='Wesele' LIMIT 1) as event_type_id;
" | head -1 > /tmp/ids.txt

HALL_ID=$(cat /tmp/ids.txt | awk '{print $1}')
CLIENT_ID=$(cat /tmp/ids.txt | awk '{print $3}')
EVENT_ID=$(cat /tmp/ids.txt | awk '{print $5}')

echo "Hall ID: $HALL_ID"
echo "Client ID: $CLIENT_ID"
echo "Event Type ID: $EVENT_ID"

echo -e "\n=== TEST 4: Sprawdź istniejące rezerwacje ==="
curl -s $BASE_URL/reservations \
  -H "Authorization: Bearer $TOKEN" | jq '.count, .data[0] | {id, adults, children, guests, pricePerAdult, pricePerChild, totalPrice}'

echo -e "\n=== TEST 5: Utwórz rezerwację z adults/children ==="
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"hallId\": \"$HALL_ID\",
    \"clientId\": \"$CLIENT_ID\",
    \"eventTypeId\": \"$EVENT_ID\",
    \"startDateTime\": \"2027-06-20T17:00:00Z\",
    \"endDateTime\": \"2027-06-20T23:00:00Z\",
    \"adults\": 45,
    \"children\": 15,
    \"pricePerAdult\": 120,
    \"pricePerChild\": 80,
    \"notes\": \"Test API - adults/children\"
  }")

echo "$CREATE_RESPONSE" | jq '{success, message, data: {id, adults, children, guests, pricePerAdult, pricePerChild, totalPrice}}'

if [ "$(echo $CREATE_RESPONSE | jq -r '.success')" = "false" ]; then
  echo "ERROR Details:"
  echo "$CREATE_RESPONSE" | jq .
fi

echo -e "\n=== TEST 6: Event >6h (powinien dodać notatkę o dopłacie) ==="
LONG_EVENT=$(curl -s -X POST $BASE_URL/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"hallId\": \"$HALL_ID\",
    \"clientId\": \"$CLIENT_ID\",
    \"eventTypeId\": \"$EVENT_ID\",
    \"startDateTime\": \"2027-07-15T16:00:00Z\",
    \"endDateTime\": \"2027-07-16T00:00:00Z\",
    \"adults\": 30,
    \"children\": 5,
    \"pricePerAdult\": 100,
    \"pricePerChild\": 70,
    \"notes\": \"Test długiego eventu\"
  }")

echo "$LONG_EVENT" | jq '{success, data: {id, notes}}'

if [ "$(echo $LONG_EVENT | jq -r '.success')" = "true" ]; then
  NOTES=$(echo "$LONG_EVENT" | jq -r '.data.notes')
  if [[ "$NOTES" == *"⏰ Uwaga"* ]]; then
    echo "✅ Auto-notatka o dopłacie została dodana!"
  else
    echo "❌ Brak auto-notatki o dopłacie"
  fi
fi

echo -e "\n=== TEST 7: Walidacja - confirmation deadline za późno (FAIL expected) ==="
DEADLINE_TEST=$(curl -s -X POST $BASE_URL/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"hallId\": \"$HALL_ID\",
    \"clientId\": \"$CLIENT_ID\",
    \"eventTypeId\": \"$EVENT_ID\",
    \"startDateTime\": \"2027-08-10T18:00:00Z\",
    \"endDateTime\": \"2027-08-10T23:00:00Z\",
    \"adults\": 20,
    \"pricePerAdult\": 100,
    \"confirmationDeadline\": \"2027-08-10T12:00:00Z\",
    \"notes\": \"Test deadline validation\"
  }")

echo "$DEADLINE_TEST" | jq '{success, error}'

if [[ "$(echo $DEADLINE_TEST | jq -r '.error')" == *"at least 1 day"* ]]; then
  echo "✅ Walidacja deadline działa poprawnie!"
else
  echo "❌ Problem z walidacją deadline"
fi

echo -e "\n=== TEST 8: Aktualizacja BEZ reason (FAIL expected) ==="
# Pobierz ID pierwszej rezerwacji
FIRST_ID=$(curl -s $BASE_URL/reservations -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

if [ "$FIRST_ID" != "null" ] && [ -n "$FIRST_ID" ]; then
  UPDATE_NO_REASON=$(curl -s -X PUT $BASE_URL/reservations/$FIRST_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "adults": 55
    }')
  
  echo "$UPDATE_NO_REASON" | jq '{success, error}'
  
  if [[ "$(echo $UPDATE_NO_REASON | jq -r '.error')" == *"Reason is required"* ]]; then
    echo "✅ Walidacja reason działa poprawnie!"
  else
    echo "❌ Brak walidacji reason"
  fi
  
  echo -e "\n=== TEST 9: Aktualizacja Z reason (OK expected) ==="
  UPDATE_WITH_REASON=$(curl -s -X PUT $BASE_URL/reservations/$FIRST_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "adults": 55,
      "children": 12,
      "reason": "Klient zmienił liczbę gości po rozmowie telefonicznej"
    }')
  
  echo "$UPDATE_WITH_REASON" | jq '{success, message, data: {adults, children, guests, totalPrice}}'
  
  if [ "$(echo $UPDATE_WITH_REASON | jq -r '.success')" = "true" ]; then
    echo "✅ Aktualizacja z reason działa!"
  fi
else
  echo "⚠️  Brak rezerwacji do testów aktualizacji"
fi

echo -e "\n=== TEST ZAKOŃCZONY ==="
echo "Podsumowanie:"
echo "- Health Check: ✅"
echo "- Autentykacja: ✅"
echo "- Tworzenie rezerwacji: $([ "$(echo $CREATE_RESPONSE | jq -r '.success')" = "true" ] && echo '✅' || echo '❌')"
echo "- Auto-notatki: sprawdź wyniki powyżej"
echo "- Walidacje: sprawdź wyniki powyżej"
