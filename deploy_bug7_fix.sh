#!/bin/bash
# ============================================
# Automated Deployment Script for Bug #7 Fix
# ============================================
# Description: Updates auto_cancel_expired_reserved() function
# Date: 07.02.2026
# Author: AI Assistant + Kamil Gol

set -e  # Exit on error

echo ""
echo "========================================="
echo "  🐛 Bug #7 Fix Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}❌ Error: docker-compose.yml not found!${NC}"
  echo "Please run this script from /home/kamil/rezerwacje directory"
  exit 1
fi

echo -e "${GREEN}✅ Found docker-compose.yml${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}1. Pulling latest changes from GitHub...${NC}"
git fetch origin feature/reservation-queue
git pull origin feature/reservation-queue
echo -e "${GREEN}✅ Git pull completed${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}2. Checking Docker containers...${NC}"
if ! docker compose ps | grep -q "rezerwacje-db.*Up"; then
  echo -e "${RED}❌ Database container not running!${NC}"
  echo "Starting containers..."
  docker compose up -d
  sleep 5
fi
echo -e "${GREEN}✅ Database is running${NC}"
echo ""

# Run the migration
echo -e "${YELLOW}3. Applying Bug #7 fix migration...${NC}"
echo "   Updating auto_cancel_expired_reserved() function..."
echo ""

# Execute SQL migration
docker compose exec -T postgres psql -U rezerwacje -d rezerwacje <<'EOSQL'
-- ============================================
-- FIX: Auto-Cancel Bug #7
-- ============================================

CREATE OR REPLACE FUNCTION auto_cancel_expired_reserved()
RETURNS TABLE(
  cancelled_count INTEGER,
  cancelled_ids UUID[]
) AS $$
DECLARE
  v_cancelled_ids UUID[];
  v_count INTEGER;
  v_system_user_id UUID;
BEGIN
  -- Get system user ID for history logging (or use first admin)
  SELECT "id" INTO v_system_user_id
  FROM "User"
  WHERE "role" = 'ADMIN' OR "role" = 'SYSTEM'
  ORDER BY "createdAt" ASC
  LIMIT 1;
  
  IF v_system_user_id IS NULL THEN
    RAISE WARNING 'No admin/system user found for history logging';
    SELECT "id" INTO v_system_user_id FROM "User" LIMIT 1;
  END IF;
  
  -- *** FIXED: Changed <= to < ***
  SELECT array_agg("id")
  INTO v_cancelled_ids
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") < CURRENT_DATE;
  
  v_count := COALESCE(array_length(v_cancelled_ids, 1), 0);
  
  UPDATE "Reservation"
  SET 
    "status" = 'CANCELLED',
    "updatedAt" = NOW(),
    "notes" = COALESCE("notes", '') || 
      E'\n\n[AUTO-CANCELLED] Rezerwacja automatycznie anulowana ' || 
      TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || 
      ' - termin minął bez awansu na listę główną.'
  WHERE "id" = ANY(v_cancelled_ids);
  
  INSERT INTO "ReservationHistory" (
    "id",
    "reservationId",
    "changedByUserId",
    "changeType",
    "fieldName",
    "oldValue",
    "newValue",
    "reason",
    "createdAt"
  )
  SELECT 
    gen_random_uuid(),
    unnest(v_cancelled_ids),
    v_system_user_id,
    'STATUS_CHANGE',
    'status',
    'RESERVED',
    'CANCELLED',
    'Automatyczne anulowanie - termin wydarzenia minął, rezerwacja pozostała na liście rezerwowej',
    NOW();
  
  RETURN QUERY SELECT v_count, v_cancelled_ids;
END;
$$ LANGUAGE plpgsql;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ auto_cancel_expired_reserved() function updated successfully';
  RAISE NOTICE '✅ Now only cancels PAST dates (< CURRENT_DATE), not today';
END;
$$;
EOSQL

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Migration applied successfully!${NC}"
else
  echo -e "${RED}❌ Migration failed!${NC}"
  exit 1
fi
echo ""

# Verify the fix
echo -e "${YELLOW}4. Verifying the fix...${NC}"
VERIFY_RESULT=$(docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -t -c "
  SELECT prosrc FROM pg_proc WHERE proname = 'auto_cancel_expired_reserved';
" | grep -c "< CURRENT_DATE")

if [ "$VERIFY_RESULT" -gt 0 ]; then
  echo -e "${GREEN}✅ Verification PASSED - Function uses '<' (not '<=')${NC}"
else
  echo -e "${RED}⚠️  Warning: Could not verify the change${NC}"
fi
echo ""

# Test the function (dry run)
echo -e "${YELLOW}5. Testing the function (dry run)...${NC}"
TEST_RESULT=$(docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -t -c "
  SELECT * FROM auto_cancel_expired_reserved();
")

echo "Test result: $TEST_RESULT"
echo -e "${GREEN}✅ Function test completed${NC}"
echo ""

# Restart backend (optional but recommended)
echo -e "${YELLOW}6. Restarting backend...${NC}"
docker compose restart backend
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}  ✅ Bug #7 Fix Deployed Successfully!${NC}"
echo "========================================="
echo ""
echo "Changes:"
echo "  • auto_cancel_expired_reserved() updated"
echo "  • Condition changed: <= to <"
echo "  • Now only cancels PAST dates"
echo ""
echo "Next cron run: Tomorrow at 00:01"
echo ""
echo "To manually test:"
echo "  docker compose exec postgres psql -U rezerwacje -d rezerwacje -c 'SELECT * FROM auto_cancel_expired_reserved();'"
echo ""
