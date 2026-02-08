-- ============================================
-- FUNCTION: Check if queue order matches natural order (createdAt)
-- ============================================
-- After swap/move, check if the queue is back to natural order
-- If yes, reset queueOrderManual flags to false
CREATE OR REPLACE FUNCTION check_queue_natural_order(
  p_queue_date TIMESTAMP
) RETURNS void AS $$
DECLARE
  v_is_natural BOOLEAN;
BEGIN
  -- Check if queue order matches createdAt order
  -- Compare actual positions with what positions would be if sorted by createdAt
  SELECT COUNT(*) = 0
  INTO v_is_natural
  FROM (
    SELECT 
      "id",
      "reservationQueuePosition" as actual_pos,
      ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as natural_pos
    FROM "Reservation"
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(p_queue_date)
  ) comparison
  WHERE actual_pos != natural_pos;
  
  -- If order is natural, reset all manual flags for this date
  IF v_is_natural THEN
    UPDATE "Reservation"
    SET "queueOrderManual" = false
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(p_queue_date)
      AND "queueOrderManual" = true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE: swap_queue_positions function
-- ============================================
-- Add check for natural order after swap
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
  -- Get current positions and dates
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_1, v_date_1
  FROM "Reservation"
  WHERE "id" = p_reservation_id_1 AND "status" = 'RESERVED';
  
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_2, v_date_2
  FROM "Reservation"
  WHERE "id" = p_reservation_id_2 AND "status" = 'RESERVED';
  
  -- Validate both reservations exist and are for the same date
  IF v_pos_1 IS NULL OR v_pos_2 IS NULL THEN
    RAISE EXCEPTION 'One or both reservations not found or not in RESERVED status';
  END IF;
  
  IF DATE(v_date_1) != DATE(v_date_2) THEN
    RAISE EXCEPTION 'Reservations must be for the same date to swap positions';
  END IF;
  
  -- Swap positions (mark as manual for now)
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_2,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_1;
  
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_1,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_2;
  
  -- ✨ NEW: Check if order is back to natural after swap
  PERFORM check_queue_natural_order(v_date_1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE: move_to_queue_position function
-- ============================================
-- Add check for natural order after move
CREATE OR REPLACE FUNCTION move_to_queue_position(
  p_reservation_id UUID,
  p_new_position INTEGER
) RETURNS void AS $$
DECLARE
  v_old_position INTEGER;
  v_queue_date TIMESTAMP;
  v_max_position INTEGER;
BEGIN
  -- Get current position and date
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_old_position, v_queue_date
  FROM "Reservation"
  WHERE "id" = p_reservation_id AND "status" = 'RESERVED';
  
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
  
  -- ✨ NEW: Check if order is back to natural after move
  PERFORM check_queue_natural_order(v_queue_date);
END;
$$ LANGUAGE plpgsql;

-- Add comment for new function
COMMENT ON FUNCTION check_queue_natural_order IS 'Checks if queue order matches createdAt order. If yes, resets queueOrderManual flags to false.';
