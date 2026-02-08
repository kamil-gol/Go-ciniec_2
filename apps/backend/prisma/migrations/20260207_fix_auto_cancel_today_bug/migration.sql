-- ============================================
-- FIX: Auto-Cancel Bug #7
-- ============================================
-- Problem: auto_cancel_expired_reserved() anuluje też dzisiejsze rezerwacje
-- Fix: Zmiana warunku z <= na < (anuluj tylko PRZESZŁE daty)
-- Date: 07.02.2026

-- Drop and recreate the function with fixed condition
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
  
  -- *** FIX: Changed <= to < ***
  -- Find all RESERVED reservations where queue date is PAST (not today!)
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

-- Verify fix
DO $$
BEGIN
  RAISE NOTICE '✅ auto_cancel_expired_reserved() function updated successfully';
  RAISE NOTICE '✅ Now only cancels PAST dates (< CURRENT_DATE), not today';
  RAISE NOTICE '';
  RAISE NOTICE 'Example:';
  RAISE NOTICE '  Today: 07.02.2026';
  RAISE NOTICE '  Queue date 07.02 → STAYS (client can still call)';
  RAISE NOTICE '  Queue date 06.02 → CANCELLED at 00:01';
END;
$$;
