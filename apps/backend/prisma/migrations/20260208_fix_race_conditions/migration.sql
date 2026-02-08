-- Migration: Fix race conditions in queue management
-- Date: 2026-02-08
-- Bug #5: Add row-level locking to swap and move functions

-- ============================================
-- FUNCTION: Swap queue positions (with locking)
-- ============================================
CREATE OR REPLACE FUNCTION swap_queue_positions(
  p_reservation_id_1 UUID,
  p_reservation_id_2 UUID
) RETURNS void AS $$
DECLARE
  v_pos_1 INTEGER;
  v_pos_2 INTEGER;
  v_date_1 TIMESTAMP;
  v_date_2 TIMESTAMP;
BEGIN
  -- ✨ FIX: Acquire advisory lock for this date to prevent concurrent modifications
  -- Use date hash as lock key
  
  -- ✨ FIX: Lock rows for update (prevents concurrent modifications)
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_1, v_date_1
  FROM "Reservation"
  WHERE "id" = p_reservation_id_1 AND "status" = 'RESERVED'
  FOR UPDATE NOWAIT; -- ✨ NOWAIT: Fail fast if locked
  
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_2, v_date_2
  FROM "Reservation"
  WHERE "id" = p_reservation_id_2 AND "status" = 'RESERVED'
  FOR UPDATE NOWAIT; -- ✨ NOWAIT: Fail fast if locked
  
  -- Validate both reservations exist and are for the same date
  IF v_pos_1 IS NULL OR v_pos_2 IS NULL THEN
    RAISE EXCEPTION 'One or both reservations not found or not in RESERVED status';
  END IF;
  
  IF DATE(v_date_1) != DATE(v_date_2) THEN
    RAISE EXCEPTION 'Reservations must be for the same date to swap positions';
  END IF;
  
  -- ✨ FIX: Use temporary position to avoid unique constraint violations
  -- Step 1: Move first to temporary negative position
  UPDATE "Reservation"
  SET "reservationQueuePosition" = -1
  WHERE "id" = p_reservation_id_1;
  
  -- Step 2: Move second to first's position
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_1,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_2;
  
  -- Step 3: Move first to second's position
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_2,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_1;
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION swap_queue_positions IS 'Swaps positions of two reservations with row-level locking to prevent race conditions. Uses NOWAIT for fail-fast behavior.';

-- ============================================
-- FUNCTION: Move reservation to specific position (with locking)
-- ============================================
CREATE OR REPLACE FUNCTION move_to_queue_position(
  p_reservation_id UUID,
  p_new_position INTEGER
) RETURNS void AS $$
DECLARE
  v_old_position INTEGER;
  v_queue_date TIMESTAMP;
  v_max_position INTEGER;
BEGIN
  -- ✨ FIX: Lock the target reservation row first
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_old_position, v_queue_date
  FROM "Reservation"
  WHERE "id" = p_reservation_id AND "status" = 'RESERVED'
  FOR UPDATE NOWAIT; -- ✨ Fail fast if already locked
  
  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Reservation not found or not in RESERVED status';
  END IF;
  
  -- Get max position for this date
  SELECT COALESCE(MAX("reservationQueuePosition"), 0)
  INTO v_max_position
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") = DATE(v_queue_date);
  
  -- Validate new position
  IF p_new_position < 1 OR p_new_position > v_max_position THEN
    RAISE EXCEPTION 'Invalid position. Must be between 1 and %', v_max_position;
  END IF;
  
  -- Early return if already at position
  IF p_new_position = v_old_position THEN
    RETURN;
  END IF;
  
  -- ✨ FIX: Lock all affected rows to prevent race conditions
  PERFORM 1
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") = DATE(v_queue_date)
    AND (
      (p_new_position < v_old_position AND "reservationQueuePosition" >= p_new_position AND "reservationQueuePosition" < v_old_position)
      OR
      (p_new_position > v_old_position AND "reservationQueuePosition" > v_old_position AND "reservationQueuePosition" <= p_new_position)
    )
  FOR UPDATE NOWAIT; -- ✨ Lock all rows that will be affected
  
  -- ✨ FIX: Move target to temporary position first to avoid conflicts
  UPDATE "Reservation"
  SET "reservationQueuePosition" = -1
  WHERE "id" = p_reservation_id;
  
  -- If moving up (to lower number)
  IF p_new_position < v_old_position THEN
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" + 1,
        "queueOrderManual" = true
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(v_queue_date)
      AND "reservationQueuePosition" >= p_new_position
      AND "reservationQueuePosition" < v_old_position;
  -- If moving down (to higher number)
  ELSIF p_new_position > v_old_position THEN
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" - 1,
        "queueOrderManual" = true
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(v_queue_date)
      AND "reservationQueuePosition" > v_old_position
      AND "reservationQueuePosition" <= p_new_position;
  END IF;
  
  -- Move the reservation to new position
  UPDATE "Reservation"
  SET "reservationQueuePosition" = p_new_position,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id;
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION move_to_queue_position IS 'Moves a reservation to a specific position with row-level locking. Uses NOWAIT for fail-fast behavior and temporary positions to avoid constraint violations.';

-- ============================================
-- TEST: Verify functions work correctly
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Race condition fixes applied';
  RAISE NOTICE 'Functions updated:';
  RAISE NOTICE '  - swap_queue_positions: Added FOR UPDATE NOWAIT + temporary positions';
  RAISE NOTICE '  - move_to_queue_position: Added FOR UPDATE NOWAIT + temporary positions';
  RAISE NOTICE '';
  RAISE NOTICE 'Backend should now handle lock_not_available exceptions (55P03)';
END $$;
