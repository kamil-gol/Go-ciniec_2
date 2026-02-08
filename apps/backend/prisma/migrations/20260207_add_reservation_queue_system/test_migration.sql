-- ============================================
-- Test Script: Reservation Queue Migration
-- ============================================
-- Run after migration to verify everything works

-- 1. Verify enum was created
SELECT 
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'ReservationStatus'
GROUP BY typname;

-- Expected: ['RESERVED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

-- 2. Verify new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Reservation' 
  AND column_name IN (
    'reservationQueuePosition', 
    'reservationQueueDate',
    'queueOrderManual',
    'status',
    'hallId',
    'eventTypeId',
    'startDateTime',
    'endDateTime'
  )
ORDER BY column_name;

-- Expected:
-- reservationQueuePosition | smallint     | YES | null
-- reservationQueueDate     | timestamp    | YES | null
-- queueOrderManual         | boolean      | NO  | false
-- status                   | USER-DEFINED | NO  | 'RESERVED'::"ReservationStatus"
-- hallId                   | uuid         | YES | null
-- eventTypeId              | uuid         | YES | null
-- startDateTime            | timestamp    | YES | null
-- endDateTime              | timestamp    | YES | null

-- 3. Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Reservation'
  AND (indexname LIKE '%queue%' OR indexname LIKE '%Queue%')
ORDER BY indexname;

-- Expected:
-- Reservation_queueOrderManual_idx
-- Reservation_reservationQueueDate_idx
-- Reservation_reservationQueuePosition_idx

-- 4. Check existing reservations migrated correctly
SELECT 
  status,
  COUNT(*) as count
FROM "Reservation" 
GROUP BY status
ORDER BY status;

-- All existing reservations should have valid enum values

-- 5. Verify functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'recalculate_queue_positions',
    'swap_queue_positions',
    'move_to_queue_position',
    'auto_cancel_expired_reserved',
    'trigger_recalculate_queue_on_status_change'
  )
ORDER BY routine_name;

-- Expected: 5 functions

-- 6. Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'recalculate_queue_on_status_change';

-- Expected: 1 trigger on UPDATE

-- ============================================
-- FUNCTIONAL TESTS
-- ============================================

-- Test 1: Create RESERVED reservations and verify auto-positioning
BEGIN;

DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_res_id_1 UUID;
  v_res_id_2 UUID;
  v_res_id_3 UUID;
  v_pos INTEGER;
BEGIN
  -- Get first client and user
  SELECT "id" INTO v_client_id FROM "Client" LIMIT 1;
  SELECT "id" INTO v_user_id FROM "User" LIMIT 1;
  
  IF v_client_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Need at least one client and one user in database';
  END IF;
  
  -- Create 3 RESERVED reservations for same date
  INSERT INTO "Reservation" (
    "id", "clientId", "createdById", "status",
    "reservationQueueDate", "reservationQueuePosition",
    "guests", "adults", "totalPrice", "queueOrderManual"
  ) VALUES (
    gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
    '2026-05-01 00:00:00', 1,
    30, 30, 0, false
  ) RETURNING "id" INTO v_res_id_1;
  
  INSERT INTO "Reservation" (
    "id", "clientId", "createdById", "status",
    "reservationQueueDate", "reservationQueuePosition",
    "guests", "adults", "totalPrice", "queueOrderManual"
  ) VALUES (
    gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
    '2026-05-01 00:00:00', 2,
    25, 25, 0, false
  ) RETURNING "id" INTO v_res_id_2;
  
  INSERT INTO "Reservation" (
    "id", "clientId", "createdById", "status",
    "reservationQueueDate", "reservationQueuePosition",
    "guests", "adults", "totalPrice", "queueOrderManual"
  ) VALUES (
    gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
    '2026-05-01 00:00:00', 3,
    20, 20, 0, false
  ) RETURNING "id" INTO v_res_id_3;
  
  RAISE NOTICE 'Created 3 test RESERVED reservations';
  
  -- Test recalculate_queue_positions
  PERFORM recalculate_queue_positions('2026-05-01'::TIMESTAMP);
  RAISE NOTICE 'Recalculated positions';
  
  -- Test swap_queue_positions
  PERFORM swap_queue_positions(v_res_id_1, v_res_id_3);
  RAISE NOTICE 'Swapped positions 1 and 3';
  
  -- Verify swap worked
  SELECT "reservationQueuePosition" INTO v_pos
  FROM "Reservation" WHERE "id" = v_res_id_1;
  
  IF v_pos != 3 THEN
    RAISE EXCEPTION 'Swap failed: expected position 3, got %', v_pos;
  END IF;
  
  RAISE NOTICE 'Swap test PASSED';
  
  -- Test move_to_queue_position
  PERFORM move_to_queue_position(v_res_id_2, 1);
  RAISE NOTICE 'Moved reservation 2 to position 1';
  
  -- Verify move worked
  SELECT "reservationQueuePosition" INTO v_pos
  FROM "Reservation" WHERE "id" = v_res_id_2;
  
  IF v_pos != 1 THEN
    RAISE EXCEPTION 'Move failed: expected position 1, got %', v_pos;
  END IF;
  
  RAISE NOTICE 'Move test PASSED';
  
  -- Display final queue
  RAISE NOTICE 'Final queue order:';
  FOR v_pos IN
    SELECT "reservationQueuePosition"
    FROM "Reservation"
    WHERE DATE("reservationQueueDate") = '2026-05-01'
    ORDER BY "reservationQueuePosition"
  LOOP
    RAISE NOTICE '  Position: %', v_pos;
  END LOOP;
  
END;
$$;

ROLLBACK;  -- Clean up test data

-- Test 2: Verify trigger fires on status change
BEGIN;

DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_hall_id UUID;
  v_event_id UUID;
  v_res_id UUID;
  v_count INTEGER;
BEGIN
  SELECT "id" INTO v_client_id FROM "Client" LIMIT 1;
  SELECT "id" INTO v_user_id FROM "User" LIMIT 1;
  SELECT "id" INTO v_hall_id FROM "Hall" LIMIT 1;
  SELECT "id" INTO v_event_id FROM "EventType" LIMIT 1;
  
  IF v_hall_id IS NULL OR v_event_id IS NULL THEN
    RAISE NOTICE 'Skipping trigger test - need Hall and EventType';
    RETURN;
  END IF;
  
  -- Create 2 RESERVED for same date
  INSERT INTO "Reservation" (
    "id", "clientId", "createdById", "status",
    "reservationQueueDate", "reservationQueuePosition",
    "guests", "adults", "totalPrice", "queueOrderManual"
  ) VALUES 
    (gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
     '2026-06-01', 1, 30, 30, 0, false),
    (gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
     '2026-06-01', 2, 25, 25, 0, false)
  RETURNING "id" INTO v_res_id;
  
  RAISE NOTICE 'Created 2 RESERVED reservations';
  
  -- Promote first one (trigger should recalculate)
  UPDATE "Reservation"
  SET 
    "status" = 'PENDING',
    "hallId" = v_hall_id,
    "eventTypeId" = v_event_id,
    "startDateTime" = '2026-06-01 18:00:00',
    "endDateTime" = '2026-06-01 23:00:00'
  WHERE "reservationQueuePosition" = 1
    AND DATE("reservationQueueDate") = '2026-06-01';
  
  RAISE NOTICE 'Promoted first reservation to PENDING';
  
  -- Check if second one moved to position 1
  SELECT COUNT(*) INTO v_count
  FROM "Reservation"
  WHERE DATE("reservationQueueDate") = '2026-06-01'
    AND "status" = 'RESERVED'
    AND "reservationQueuePosition" = 1;
  
  IF v_count = 1 THEN
    RAISE NOTICE 'Trigger test PASSED - position recalculated';
  ELSE
    RAISE EXCEPTION 'Trigger test FAILED - expected 1 reservation at pos 1, found %', v_count;
  END IF;
  
END;
$$;

ROLLBACK;

-- Test 3: Test auto_cancel_expired_reserved (dry run)
BEGIN;

DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_res_id UUID;
  v_result RECORD;
BEGIN
  SELECT "id" INTO v_client_id FROM "Client" LIMIT 1;
  SELECT "id" INTO v_user_id FROM "User" LIMIT 1;
  
  -- Create RESERVED with past date
  INSERT INTO "Reservation" (
    "id", "clientId", "createdById", "status",
    "reservationQueueDate", "reservationQueuePosition",
    "guests", "adults", "totalPrice"
  ) VALUES (
    gen_random_uuid(), v_client_id, v_user_id, 'RESERVED',
    CURRENT_DATE - INTERVAL '1 day', 1,
    30, 30, 0
  ) RETURNING "id" INTO v_res_id;
  
  RAISE NOTICE 'Created expired RESERVED reservation';
  
  -- Test auto-cancel function
  SELECT * INTO v_result FROM auto_cancel_expired_reserved();
  
  RAISE NOTICE 'Auto-cancel result: % reservations cancelled', v_result.cancelled_count;
  
  IF v_result.cancelled_count >= 1 THEN
    RAISE NOTICE 'Auto-cancel test PASSED';
  ELSE
    RAISE EXCEPTION 'Auto-cancel test FAILED';
  END IF;
  
END;
$$;

ROLLBACK;

-- ============================================
-- Performance Tests
-- ============================================

-- Test queue query performance (should use index)
EXPLAIN ANALYZE
SELECT 
  "id",
  "clientId",
  "reservationQueuePosition",
  "guests",
  "createdAt"
FROM "Reservation"
WHERE "status" = 'RESERVED'
  AND "reservationQueueDate" >= DATE '2026-03-01'
  AND "reservationQueueDate" < DATE '2026-04-01'
ORDER BY "reservationQueueDate" ASC, "reservationQueuePosition" ASC;

-- Should use index on reservationQueueDate

-- ============================================
-- Foreign Key Constraints Verification
-- ============================================
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"Reservation"'::regclass
  AND contype = 'f' -- foreign key
ORDER BY conname;

-- ============================================
-- Summary Report
-- ============================================
SELECT 
  'Migration Verification Complete' as status,
  NOW() as checked_at;

RAISE NOTICE '=========================================';
RAISE NOTICE 'All tests completed!';
RAISE NOTICE '=========================================';
