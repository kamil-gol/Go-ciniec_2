-- CreateEnum: ReservationStatus
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- Add new columns for reservation queue system
ALTER TABLE "Reservation" 
  ADD COLUMN IF NOT EXISTS "reservationQueuePosition" SMALLINT,
  ADD COLUMN IF NOT EXISTS "reservationQueueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "queueOrderManual" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for queue system
CREATE INDEX IF NOT EXISTS "Reservation_reservationQueueDate_idx" ON "Reservation"("reservationQueueDate");
CREATE INDEX IF NOT EXISTS "Reservation_reservationQueuePosition_idx" ON "Reservation"("reservationQueuePosition");
CREATE INDEX IF NOT EXISTS "Reservation_queueOrderManual_idx" ON "Reservation"("queueOrderManual");

-- Migrate existing status values to enum
-- First, add a temporary column with the new enum type
ALTER TABLE "Reservation" ADD COLUMN "status_new" "ReservationStatus";

-- Map existing VARCHAR status values to enum values
UPDATE "Reservation" 
SET "status_new" = CASE 
  WHEN "status" = 'PENDING' THEN 'PENDING'::"ReservationStatus"
  WHEN "status" = 'CONFIRMED' THEN 'CONFIRMED'::"ReservationStatus"
  WHEN "status" = 'COMPLETED' THEN 'COMPLETED'::"ReservationStatus"
  WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"ReservationStatus"
  ELSE 'PENDING'::"ReservationStatus" -- Default fallback
END;

-- Drop the old status column and rename the new one
ALTER TABLE "Reservation" DROP COLUMN "status";
ALTER TABLE "Reservation" RENAME COLUMN "status_new" TO "status";

-- Set default value for status
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'RESERVED'::"ReservationStatus";
ALTER TABLE "Reservation" ALTER COLUMN "status" SET NOT NULL;

-- Make hallId, eventTypeId, startDateTime, endDateTime nullable for RESERVED status
ALTER TABLE "Reservation" ALTER COLUMN "hallId" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "eventTypeId" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "startDateTime" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "endDateTime" DROP NOT NULL;

-- ============================================
-- FUNCTION: Recalculate queue positions
-- ============================================
-- Called when a RESERVED reservation is cancelled or promoted
CREATE OR REPLACE FUNCTION recalculate_queue_positions(
  p_queue_date TIMESTAMP,
  p_exclude_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_reservation RECORD;
  v_position INTEGER := 1;
BEGIN
  -- Only recalculate for automatic ordering (queueOrderManual = false)
  FOR v_reservation IN
    SELECT "id"
    FROM "Reservation"
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(p_queue_date)
      AND "queueOrderManual" = false
      AND (p_exclude_id IS NULL OR "id" != p_exclude_id)
    ORDER BY "createdAt" ASC  -- First come, first served
  LOOP
    UPDATE "Reservation"
    SET "reservationQueuePosition" = v_position
    WHERE "id" = v_reservation."id";
    
    v_position := v_position + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-recalculate on status change
-- ============================================
-- When RESERVED is cancelled or promoted, recalculate positions
CREATE OR REPLACE FUNCTION trigger_recalculate_queue_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed FROM RESERVED to something else
  IF OLD."status" = 'RESERVED' AND NEW."status" != 'RESERVED' THEN
    -- Only recalculate if not manually ordered
    IF OLD."queueOrderManual" = false THEN
      PERFORM recalculate_queue_positions(OLD."reservationQueueDate", OLD."id");
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_queue_on_status_change
AFTER UPDATE OF "status" ON "Reservation"
FOR EACH ROW
WHEN (OLD."status" IS DISTINCT FROM NEW."status")
EXECUTE FUNCTION trigger_recalculate_queue_on_status_change();

-- ============================================
-- FUNCTION: Swap queue positions (manual reordering)
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
  
  -- Swap positions
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_2,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_1;
  
  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_1,
      "queueOrderManual" = true
  WHERE "id" = p_reservation_id_2;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Move reservation to specific position
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
  
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN "Reservation"."reservationQueuePosition" IS 'Position in queue for a specific day (1, 2, 3...). Only for RESERVED status.';
COMMENT ON COLUMN "Reservation"."reservationQueueDate" IS 'The date this reservation is queued for. Only for RESERVED status.';
COMMENT ON COLUMN "Reservation"."queueOrderManual" IS 'If true, queue position was manually set and should not be auto-recalculated.';
COMMENT ON COLUMN "Reservation"."status" IS 'RESERVED: Minimal data, waiting list. PENDING: Complete data, awaiting confirmation. CONFIRMED: Confirmed reservation. COMPLETED: Event finished. CANCELLED: Cancelled reservation.';
COMMENT ON COLUMN "Reservation"."hallId" IS 'Required for PENDING/CONFIRMED/COMPLETED statuses. Optional for RESERVED.';
COMMENT ON COLUMN "Reservation"."eventTypeId" IS 'Required for PENDING/CONFIRMED/COMPLETED statuses. Optional for RESERVED.';
COMMENT ON COLUMN "Reservation"."startDateTime" IS 'Required for PENDING/CONFIRMED/COMPLETED statuses. Optional for RESERVED.';
COMMENT ON COLUMN "Reservation"."endDateTime" IS 'Required for PENDING/CONFIRMED/COMPLETED statuses. Optional for RESERVED.';

COMMENT ON FUNCTION recalculate_queue_positions IS 'Recalculates queue positions for a specific date, excluding manually ordered reservations';
COMMENT ON FUNCTION swap_queue_positions IS 'Swaps positions of two reservations in the queue and marks them as manually ordered';
COMMENT ON FUNCTION move_to_queue_position IS 'Moves a reservation to a specific position in the queue, shifting others accordingly';
