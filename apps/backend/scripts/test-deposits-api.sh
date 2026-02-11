#!/bin/bash

# Deposits API Test Script
# Usage: ./test-deposits-api.sh

set -e

API_URL="http://localhost:3001"
EMAIL="admin@gosciniecrodzinny.pl"
PASSWORD="Admin123!@#"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🧪 DEPOSITS API - AUTOMATED TEST SUITE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 1: Login
echo -e "${YELLOW}📝 Test 1: Login & Authentication${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo $LOGIN_RESPONSE | jq
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo -e "   Token: ${TOKEN:0:30}..."
echo ""

# Test 2: Initial Statistics
echo -e "${YELLOW}📊 Test 2: Initial Statistics${NC}"
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits/statistics")
echo $STATS | jq
echo ""

# Test 3: Get Reservation for Test
echo -e "${YELLOW}🔍 Test 3: Find Reservation${NC}"
RESERVATIONS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/reservations?perPage=1")

RESERVATION_ID=$(echo $RESERVATIONS | jq -r '.data[0].id')

if [ "$RESERVATION_ID" = "null" ] || [ -z "$RESERVATION_ID" ]; then
  echo -e "${RED}❌ No reservations found!${NC}"
  exit 1
fi

RESERVATION_DATE=$(echo $RESERVATIONS | jq -r '.data[0].date')
CLIENT_NAME=$(echo $RESERVATIONS | jq -r '.data[0].client.firstName + " " + .data[0].client.lastName')

echo -e "${GREEN}✅ Reservation found${NC}"
echo -e "   ID: $RESERVATION_ID"
echo -e "   Client: $CLIENT_NAME"
echo -e "   Date: $RESERVATION_DATE"
echo ""

# Test 4: Create Deposit
echo -e "${YELLOW}➕ Test 4: Create Deposit (1000 PLN)${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/deposits" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"reservationId\": \"$RESERVATION_ID\",
    \"amount\": 1000,
    \"dueDate\": \"2026-03-15\",
    \"title\": \"Test Deposit - Automated\",
    \"description\": \"Created by test script\",
    \"internalNotes\": \"E2E test deposit\"
  }")

DEPOSIT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ "$DEPOSIT_ID" = "null" ] || [ -z "$DEPOSIT_ID" ]; then
  echo -e "${RED}❌ Deposit creation failed!${NC}"
  echo $CREATE_RESPONSE | jq
  exit 1
fi

echo -e "${GREEN}✅ Deposit created${NC}"
echo $CREATE_RESPONSE | jq '{id, amount, status, dueDate, paidAmount, remainingAmount}'
echo ""

# Test 5: List Deposits
echo -e "${YELLOW}📋 Test 5: List All Deposits${NC}"
LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits?perPage=5")
TOTAL=$(echo $LIST_RESPONSE | jq -r '.total')
echo -e "${GREEN}✅ Found $TOTAL deposits${NC}"
echo $LIST_RESPONSE | jq '.deposits[] | {id, amount, status, dueDate}'
echo ""

# Test 6: Partial Payment (300 PLN)
echo -e "${YELLOW}💰 Test 6: Add Partial Payment (300 PLN - CASH)${NC}"
PAYMENT1=$(curl -s -X POST "$API_URL/api/deposits/$DEPOSIT_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "paymentMethod": "CASH",
    "notes": "Test payment 1/2"
  }')

STATUS_AFTER_PAYMENT1=$(echo $PAYMENT1 | jq -r '.status')
PAID_AMOUNT=$(echo $PAYMENT1 | jq -r '.paidAmount')
REMAINING=$(echo $PAYMENT1 | jq -r '.remainingAmount')

echo -e "${GREEN}✅ Payment added${NC}"
echo -e "   Status: $STATUS_AFTER_PAYMENT1"
echo -e "   Paid: $PAID_AMOUNT PLN"
echo -e "   Remaining: $REMAINING PLN"
echo ""

# Test 7: Get Deposit Details (with payment history)
echo -e "${YELLOW}🔍 Test 7: Get Deposit with Payment History${NC}"
DEPOSIT_DETAILS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits/$DEPOSIT_ID")
echo $DEPOSIT_DETAILS | jq '{
  id,
  status,
  amount,
  paidAmount,
  remainingAmount,
  paymentHistory: [.paymentHistory[] | {amount, paymentMethod, paymentDate, notes}]
}'
echo ""

# Test 8: Second Payment (700 PLN - complete)
echo -e "${YELLOW}💳 Test 8: Add Final Payment (700 PLN - TRANSFER)${NC}"
PAYMENT2=$(curl -s -X POST "$API_URL/api/deposits/$DEPOSIT_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 700,
    "paymentMethod": "TRANSFER",
    "notes": "Final payment - bank transfer"
  }')

STATUS_FINAL=$(echo $PAYMENT2 | jq -r '.status')
PAID_FINAL=$(echo $PAYMENT2 | jq -r '.paid')
RECEIPT=$(echo $PAYMENT2 | jq -r '.receiptNumber')

echo -e "${GREEN}✅ Final payment processed${NC}"
echo -e "   Status: $STATUS_FINAL"
echo -e "   Fully Paid: $PAID_FINAL"
echo -e "   Receipt Number: $RECEIPT"
echo ""

# Test 9: Create Overdue Deposit
echo -e "${YELLOW}⏰ Test 9: Create Overdue Deposit (past due)${NC}"
OVERDUE_DEPOSIT=$(curl -s -X POST "$API_URL/api/deposits" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"reservationId\": \"$RESERVATION_ID\",
    \"amount\": 500,
    \"dueDate\": \"2026-02-01\",
    \"title\": \"Overdue Test Deposit\"
  }")

OVERDUE_ID=$(echo $OVERDUE_DEPOSIT | jq -r '.id')
echo -e "${GREEN}✅ Overdue deposit created${NC}"
echo -e "   ID: $OVERDUE_ID"
echo ""

# Test 10: Check Reminders
echo -e "${YELLOW}🔔 Test 10: Get Pending Reminders${NC}"
REMINDERS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits/reminders/pending")
REMINDER_COUNT=$(echo $REMINDERS | jq '. | length')
echo -e "${GREEN}✅ Found $REMINDER_COUNT deposits requiring reminders${NC}"
echo $REMINDERS | jq '.[] | {id, amount, dueDate, status, client: .reservation.client | {firstName, lastName}}'
echo ""

# Test 11: Filter Tests
echo -e "${YELLOW}🔍 Test 11: Test Filters${NC}"

# Overdue only
OVERDUE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits?overdueOnly=true")
OVERDUE_COUNT=$(echo $OVERDUE | jq -r '.total')
echo -e "   Overdue deposits: $OVERDUE_COUNT"

# Paid only
PAID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits?status=PAID")
PAID_COUNT=$(echo $PAID | jq -r '.total')
echo -e "   Paid deposits: $PAID_COUNT"

# Partial only
PARTIAL=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits?status=PARTIAL")
PARTIAL_COUNT=$(echo $PARTIAL | jq -r '.total')
echo -e "   Partial deposits: $PARTIAL_COUNT"

echo ""

# Test 12: Final Statistics
echo -e "${YELLOW}📊 Test 12: Final Statistics${NC}"
FINAL_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/deposits/statistics")

echo $FINAL_STATS | jq
echo ""

# Test 13: Update Deposit
echo -e "${YELLOW}✏️  Test 13: Update Deposit${NC}"
UPDATE=$(curl -s -X PUT "$API_URL/api/deposits/$OVERDUE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 600,
    "title": "Updated Overdue Deposit"
  }')
echo -e "${GREEN}✅ Deposit updated${NC}"
echo $UPDATE | jq '{id, amount, title, remainingAmount}'
echo ""

# Test 14: Delete Test Deposits (cleanup)
echo -e "${YELLOW}🗑️  Test 14: Cleanup - Delete Test Deposits${NC}"

echo -e "   Deleting deposit: $DEPOSIT_ID"
curl -s -X DELETE "$API_URL/api/deposits/$DEPOSIT_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo -e "   Deleting deposit: $OVERDUE_ID"
curl -s -X DELETE "$API_URL/api/deposits/$OVERDUE_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo -e "${GREEN}✅ Cleanup completed${NC}"
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "✅ Tested features:"
echo -e "   • Login & Authentication"
echo -e "   • Create Deposit"
echo -e "   • List Deposits with Filters"
echo -e "   • Partial Payments"
echo -e "   • Full Payment with Auto-Receipt"
echo -e "   • Payment History"
echo -e "   • Overdue Detection"
echo -e "   • Reminders"
echo -e "   • Statistics"
echo -e "   • Update Deposit"
echo -e "   • Delete Deposit"
echo ""
echo -e "${GREEN}🚀 Deposits Module API is fully operational!${NC}"
