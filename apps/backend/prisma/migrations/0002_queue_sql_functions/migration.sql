-- Queue SQL Functions
-- These functions are used by queue.service.ts for atomic position operations
-- with row-level locking (FOR UPDATE) to prevent race conditions.

-- ═══════════════════════════════════════════════════════════════════
-- swap_queue_positions: Atomically swap positions of two reservations
-- Uses temporary position -1 to avoid unique constraint violations
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS swap_queue_positions(UUID, UUID);

CREATE OR REPLACE FUNCTION swap_queue_positions(id1 UUID, id2 UUID)
RETURNS VOID AS $$
DECLARE
  pos1 INTEGER;
  pos2 INTEGER;
BEGIN
  -- Lock both rows to prevent concurrent modifications
  SELECT "reservationQueuePosition" INTO pos1
    FROM "Reservation" WHERE id = id1 FOR UPDATE;
  SELECT "reservationQueuePosition" INTO pos2
    FROM "Reservation" WHERE id = id2 FOR UPDATE;

  -- Use temporary position -1 to avoid unique constraint violation
  UPDATE "Reservation" SET "reservationQueuePosition" = -1,
    "queueOrderManual" = true WHERE id = id1;
  UPDATE "Reservation" SET "reservationQueuePosition" = pos1,
    "queueOrderManual" = true WHERE id = id2;
  UPDATE "Reservation" SET "reservationQueuePosition" = pos2,
    "queueOrderManual" = true WHERE id = id1;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- move_to_queue_position: Move a reservation to a specific position
-- Shifts other reservations on the same date accordingly
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS move_to_queue_position(UUID, INTEGER);

CREATE OR REPLACE FUNCTION move_to_queue_position(res_id UUID, new_pos INTEGER)
RETURNS VOID AS $$
DECLARE
  old_pos INTEGER;
  queue_date TIMESTAMP;
BEGIN
  -- Lock the target row
  SELECT "reservationQueuePosition", "reservationQueueDate"
    INTO old_pos, queue_date
    FROM "Reservation" WHERE id = res_id FOR UPDATE;

  -- No-op if already at target position
  IF old_pos = new_pos THEN RETURN; END IF;

  -- Shift other reservations on the same date
  IF new_pos < old_pos THEN
    -- Moving up: shift others down
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" + 1
    WHERE status = 'RESERVED'
      AND "reservationQueueDate"::date = queue_date::date
      AND "reservationQueuePosition" >= new_pos
      AND "reservationQueuePosition" < old_pos
      AND id != res_id;
  ELSE
    -- Moving down: shift others up
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" - 1
    WHERE status = 'RESERVED'
      AND "reservationQueueDate"::date = queue_date::date
      AND "reservationQueuePosition" > old_pos
      AND "reservationQueuePosition" <= new_pos
      AND id != res_id;
  END IF;

  -- Set the target reservation to new position
  UPDATE "Reservation"
  SET "reservationQueuePosition" = new_pos, "queueOrderManual" = true
  WHERE id = res_id;
END;
$$ LANGUAGE plpgsql;
