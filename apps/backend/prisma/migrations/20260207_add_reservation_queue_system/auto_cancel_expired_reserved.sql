-- ============================================
-- Auto-Cancel Expired RESERVED Reservations
-- ============================================
-- Purpose: Automatically cancel RESERVED reservations AFTER their event date
-- Schedule: Run daily at 00:01 AM via cron job
-- Usage: psql -U postgres -d rezerwacje -f auto_cancel_expired_reserved.sql
-- 
-- ⚠️ FIX: Changed <= to < (don't cancel TODAY, only PAST dates)

-- Function: Cancel expired RESERVED reservations
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
    -- Use first user as fallback
    SELECT "id" INTO v_system_user_id FROM "User" LIMIT 1;
  END IF;
  
  -- *** FIXED: Changed <= to < ***
  -- Find all RESERVED reservations where queue date is PAST (not today!)
  -- Example:
  --   Today: 07.02.2026
  --   Queue date 07.02 → STAYS (client can still call during the day)
  --   Queue date 06.02 → CANCELLED at 00:01
  SELECT array_agg("id")
  INTO v_cancelled_ids
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") < CURRENT_DATE;  -- FIXED: was <=
  
  -- Get count
  v_count := COALESCE(array_length(v_cancelled_ids, 1), 0);
  
  -- Update status to CANCELLED
  UPDATE "Reservation"
  SET 
    "status" = 'CANCELLED',
    "updatedAt" = NOW(),
    "notes" = COALESCE("notes", '') || 
      E'\n\n[AUTO-CANCELLED] Rezerwacja automatycznie anulowana ' || 
      TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || 
      ' - termin minął bez awansu na listę główną.'
  WHERE "id" = ANY(v_cancelled_ids);
  
  -- Log to history
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
  
  -- Return results
  RETURN QUERY SELECT v_count, v_cancelled_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Execute the function
-- ============================================
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM auto_cancel_expired_reserved();
  
  RAISE NOTICE 'Auto-cancel completed: % RESERVED reservations cancelled', v_result.cancelled_count;
  
  IF v_result.cancelled_count > 0 THEN
    RAISE NOTICE 'Cancelled IDs: %', v_result.cancelled_ids;
  END IF;
END;
$$;

-- ============================================
-- Dry-run query (for testing)
-- ============================================
-- Uncomment to see which reservations would be cancelled
/*
SELECT 
  r."id",
  c."firstName" || ' ' || c."lastName" AS client_name,
  r."reservationQueueDate" AS queue_date,
  r."reservationQueuePosition" AS position,
  r."guests" AS guest_count,
  r."createdAt" AS created_at
FROM "Reservation" r
JOIN "Client" c ON r."clientId" = c."id"
WHERE r."status" = 'RESERVED'
  AND DATE(r."reservationQueueDate") < CURRENT_DATE  -- FIXED: was <=
ORDER BY r."reservationQueueDate" ASC, r."reservationQueuePosition" ASC;
*/

-- ============================================
-- Cron Setup Instructions
-- ============================================
/*
# Add to crontab (edit with: crontab -e)
# Run daily at 00:01 AM

1 0 * * * docker-compose -f /home/kamil/rezerwacje/docker-compose.yml exec -T db psql -U postgres -d rezerwacje -f /path/to/auto_cancel_expired_reserved.sql >> /var/log/auto_cancel_reserved.log 2>&1

# Or use node-cron in backend:
const cron = require('node-cron');

// Run every day at 00:01 AM
cron.schedule('1 0 * * *', async () => {
  await prisma.$executeRaw`SELECT * FROM auto_cancel_expired_reserved()`;
});
*/
