#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URL
API_URL="http://62.171.189.172:3001"

echo "${YELLOW}=== Testing Rezerwacje API ===${NC}"
echo ""

# Step 1: Login and get token
echo "${YELLOW}Step 1: Logging in as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosciniecrodzinny.pl",
    "password": "admin123"
  }')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extract token using jq
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // .token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "${RED}Failed to get token!${NC}"
  echo "Login response: $LOGIN_RESPONSE"
  exit 1
fi

echo "${GREEN}Token obtained successfully!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Test GET /api/clients
echo "${YELLOW}Step 2: Fetching clients...${NC}"
CLIENTS_RESPONSE=$(curl -s -X GET "${API_URL}/api/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "${GREEN}Clients response:${NC}"
echo $CLIENTS_RESPONSE | jq .
echo ""

# Count clients
CLIENT_COUNT=$(echo $CLIENTS_RESPONSE | jq '.data | length // 0')
echo "${GREEN}Total clients found: $CLIENT_COUNT${NC}"
echo ""

# Step 3: Test GET /api/halls
echo "${YELLOW}Step 3: Fetching halls...${NC}"
HALLS_RESPONSE=$(curl -s -X GET "${API_URL}/api/halls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "${GREEN}Halls response:${NC}"
echo $HALLS_RESPONSE | jq .
echo ""

# Step 4: Test GET /api/event-types
echo "${YELLOW}Step 4: Fetching event types...${NC}"
EVENT_TYPES_RESPONSE=$(curl -s -X GET "${API_URL}/api/event-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "${GREEN}Event types response:${NC}"
echo $EVENT_TYPES_RESPONSE | jq .
echo ""

# Step 5: Check database directly
echo "${YELLOW}Step 5: Checking database directly...${NC}"
docker exec -it rezerwacje-db psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) as total_clients FROM \"Client\";"
echo ""
docker exec -it rezerwacje-db psql -U rezerwacje -d rezerwacje -c "SELECT id, \"firstName\", \"lastName\", email FROM \"Client\" LIMIT 5;"
echo ""

echo "${GREEN}=== Test completed! ===${NC}"
echo ""
echo "${YELLOW}You can use this token for manual testing:${NC}"
echo "export TOKEN='$TOKEN'"
echo ""
echo "${YELLOW}Example commands:${NC}"
echo "curl -H \"Authorization: Bearer \$TOKEN\" $API_URL/api/clients | jq"
echo "curl -H \"Authorization: Bearer \$TOKEN\" $API_URL/api/halls | jq"
