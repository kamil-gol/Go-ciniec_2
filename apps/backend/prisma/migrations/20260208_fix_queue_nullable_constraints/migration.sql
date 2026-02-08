-- Migration: Add constraints for queue nullable fields
-- Date: 2026-02-08
-- Bug #9: Enforce queue field consistency based on status

-- ============================================
-- CHECK CONSTRAINT: Queue fields for RESERVED
-- ============================================
-- If status = RESERVED, queue fields are REQUIRED
-- If status != RESERVED, queue fields must be NULL

ALTER TABLE "Reservation"
ADD CONSTRAINT check_queue_fields_for_reserved
CHECK (
  (
    -- RESERVED: Queue fields must be present
    "status" = 'RESERVED' AND
    "reservationQueuePosition" IS NOT NULL AND
    "reservationQueueDate" IS NOT NULL
  )
  OR
  (
    -- NOT RESERVED: Queue fields must be NULL
    "status" != 'RESERVED' AND
    "reservationQueuePosition" IS NULL AND
    "reservationQueueDate" IS NULL
  )
);

COMMENT ON CONSTRAINT check_queue_fields_for_reserved ON "Reservation" IS 
  'Ensures queue fields are present for RESERVED status and NULL for all other statuses';

-- ============================================
-- UNIQUE CONSTRAINT: Position per date
-- ============================================
-- Only one reservation can have the same position on the same date
-- Uses partial index to only apply to RESERVED reservations

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_queue_position_per_date
ON "Reservation" (
  DATE("reservationQueueDate"),
  "reservationQueuePosition"
)
WHERE "status" = 'RESERVED'
AND "reservationQueuePosition" IS NOT NULL
AND "reservationQueueDate" IS NOT NULL;

COMMENT ON INDEX idx_unique_queue_position_per_date IS 
  'Ensures unique position per date for RESERVED reservations';

-- ============================================
-- CHECK CONSTRAINT: Position must be positive
-- ============================================
ALTER TABLE "Reservation"
ADD CONSTRAINT check_queue_position_positive
CHECK (
  "reservationQueuePosition" IS NULL 
  OR 
  "reservationQueuePosition" > 0
);

COMMENT ON CONSTRAINT check_queue_position_positive ON "Reservation" IS 
  'Ensures queue position is always positive (>0) when present';

-- ============================================
-- VALIDATION: Check existing data
-- ============================================
DO $$
DECLARE
  v_invalid_reserved_count INTEGER;
  v_invalid_non_reserved_count INTEGER;
  v_duplicate_positions_count INTEGER;
BEGIN
  -- Check RESERVED without queue fields
  SELECT COUNT(*)
  INTO v_invalid_reserved_count
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND ("reservationQueuePosition" IS NULL OR "reservationQueueDate" IS NULL);
  
  -- Check non-RESERVED with queue fields
  SELECT COUNT(*)
  INTO v_invalid_non_reserved_count
  FROM "Reservation"
  WHERE "status" != 'RESERVED'
    AND ("reservationQueuePosition" IS NOT NULL OR "reservationQueueDate" IS NOT NULL);
  
  -- Check duplicate positions
  SELECT COUNT(*)
  INTO v_duplicate_positions_count
  FROM (
    SELECT DATE("reservationQueueDate") as queue_date, "reservationQueuePosition"
    FROM "Reservation"
    WHERE "status" = 'RESERVED'
      AND "reservationQueuePosition" IS NOT NULL
      AND "reservationQueueDate" IS NOT NULL
    GROUP BY DATE("reservationQueueDate"), "reservationQueuePosition"
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Report findings
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Queue Fields Validation Report';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESERVED without queue fields: %', v_invalid_reserved_count;
  RAISE NOTICE 'Non-RESERVED with queue fields: %', v_invalid_non_reserved_count;
  RAISE NOTICE 'Duplicate position conflicts: %', v_duplicate_positions_count;
  RAISE NOTICE '============================================';
  
  IF v_invalid_reserved_count > 0 THEN
    RAISE WARNING 'Found % RESERVED reservations without queue fields. These need to be fixed manually.', v_invalid_reserved_count;
  END IF;
  
  IF v_invalid_non_reserved_count > 0 THEN
    RAISE NOTICE 'Cleaning % non-RESERVED reservations with queue fields...', v_invalid_non_reserved_count;
    
    -- Auto-fix: Clear queue fields for non-RESERVED
    UPDATE "Reservation"
    SET 
      "reservationQueuePosition" = NULL,
      "reservationQueueDate" = NULL
    WHERE "status" != 'RESERVED'
      AND ("reservationQueuePosition" IS NOT NULL OR "reservationQueueDate" IS NOT NULL);
    
    RAISE NOTICE '✅ Cleaned % reservations', v_invalid_non_reserved_count;
  END IF;
  
  IF v_duplicate_positions_count > 0 THEN
    RAISE WARNING 'Found % duplicate position conflicts. Run rebuild_queue_positions to fix.', v_duplicate_positions_count;
  END IF;
  
  IF v_invalid_reserved_count = 0 AND v_invalid_non_reserved_count = 0 AND v_duplicate_positions_count = 0 THEN
    RAISE NOTICE '✅ All queue fields are consistent!';
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTION: Validate before insert/update
-- ============================================
CREATE OR REPLACE FUNCTION validate_queue_fields_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate RESERVED status
  IF NEW."status" = 'RESERVED' THEN
    IF NEW."reservationQueuePosition" IS NULL OR NEW."reservationQueueDate" IS NULL THEN
      RAISE EXCEPTION 'RESERVED reservations must have reservationQueuePosition and reservationQueueDate';
    END IF;
    
    IF NEW."reservationQueuePosition" <= 0 THEN
      RAISE EXCEPTION 'Queue position must be positive (>0), got: %', NEW."reservationQueuePosition";
    END IF;
  END IF;
  
  -- Validate non-RESERVED status
  IF NEW."status" != 'RESERVED' THEN
    IF NEW."reservationQueuePosition" IS NOT NULL OR NEW."reservationQueueDate" IS NOT NULL THEN
      RAISE EXCEPTION 'Only RESERVED reservations can have queue fields. Status: %, Position: %, Date: %',
        NEW."status", NEW."reservationQueuePosition", NEW."reservationQueueDate";
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_queue_fields
BEFORE INSERT OR UPDATE ON "Reservation"
FOR EACH ROW
EXECUTE FUNCTION validate_queue_fields_before_save();

COMMENT ON TRIGGER validate_queue_fields ON "Reservation" IS 
  'Validates queue fields consistency before insert/update';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added constraints:';
  RAISE NOTICE '  1. check_queue_fields_for_reserved - Enforces queue fields based on status';
  RAISE NOTICE '  2. check_queue_position_positive - Ensures positive position values';
  RAISE NOTICE '  3. idx_unique_queue_position_per_date - Prevents duplicate positions';
  RAISE NOTICE '  4. validate_queue_fields - Trigger for pre-save validation';
  RAISE NOTICE '';
  RAISE NOTICE 'Queue field rules:';
  RAISE NOTICE '  - RESERVED: Must have position + date';
  RAISE NOTICE '  - Other statuses: Must NOT have position + date';
  RAISE NOTICE '  - Position must be > 0';
  RAISE NOTICE '  - No duplicate positions per date';
  RAISE NOTICE '';
END $$;
