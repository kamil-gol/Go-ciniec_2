#!/bin/bash

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api"

echo -e "${BLUE}=== Queue API Test Script ===${NC}\n"

# 1. Login i pobierz token
echo -e "${BLUE}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosciniecrodzinny.pl",
    "password": "admin123"
  }')

# Wyciągnij token (używając grep i sed, bez jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Test queue stats
echo -e "${BLUE}2. Getting queue statistics...${NC}"
STATS=$(curl -s ${API_URL}/queue/stats \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
echo ""

# 3. Get all queues
echo -e "${BLUE}3. Getting all queues...${NC}"
QUEUES=$(curl -s ${API_URL}/queue \
  -H "Authorization: Bearer $TOKEN")
echo "$QUEUES" | python3 -m json.tool 2>/dev/null || echo "$QUEUES"
echo ""

# 4. Get clients (to get a client ID for testing)
echo -e "${BLUE}4. Getting first client ID...${NC}"
CLIENTS=$(curl -s ${API_URL}/clients \
  -H "Authorization: Bearer $TOKEN")

# Wyciągnij pierwsze ID klienta
CLIENT_ID=$(echo $CLIENTS | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

if [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}❌ No clients found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found client: $CLIENT_ID${NC}"
echo ""

# 5. Add to queue
echo -e "${BLUE}5. Adding reservation to queue...${NC}"
ADD_RESPONSE=$(curl -s -X POST ${API_URL}/queue/reserved \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"reservationQueueDate\": \"2026-03-15\",
    \"guests\": 30,
    \"adults\": 25,
    \"children\": 5,
    \"notes\": \"Test z skryptu\"
  }")
echo "$ADD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADD_RESPONSE"
echo ""

# 6. Get queue for specific date
echo -e "${BLUE}6. Getting queue for 2026-03-15...${NC}"
DATE_QUEUE=$(curl -s ${API_URL}/queue/2026-03-15 \
  -H "Authorization: Bearer $TOKEN")
echo "$DATE_QUEUE" | python3 -m json.tool 2>/dev/null || echo "$DATE_QUEUE"
echo ""

# 7. Test auto-cancel (manual trigger)
echo -e "${BLUE}7. Triggering manual auto-cancel...${NC}"
CANCEL_RESPONSE=$(curl -s -X POST ${API_URL}/queue/auto-cancel \
  -H "Authorization: Bearer $TOKEN")
echo "$CANCEL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CANCEL_RESPONSE"
echo ""

echo -e "${GREEN}=== All tests completed! ===${NC}"
echo ""
echo -e "${YELLOW}To use token manually:${NC}"
echo "export TOKEN=\"$TOKEN\""
echo ""
echo -e "${YELLOW}Then you can run:${NC}"
echo "curl ${API_URL}/queue/stats -H \"Authorization: Bearer \$TOKEN\""
echo "curl ${API_URL}/queue -H \"Authorization: Bearer \$TOKEN\""
echo "curl ${API_URL}/queue/2026-03-15 -H \"Authorization: Bearer \$TOKEN\""
echo ""
