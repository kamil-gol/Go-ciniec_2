-- =============================================================================
-- MIGRATION: Fix timezone shift for reservations created before toLocalISO() fix
-- =============================================================================
--
-- PROBLEM:
--   Before the fix, the frontend sent naive ISO strings (e.g. "2026-03-07T14:00")
--   without a timezone offset. PostgreSQL stored them as UTC, so a reservation
--   entered as "14:00 Warsaw" was saved as 14:00 UTC = 15:00 Warsaw.
--
-- EFFECT:
--   All reservations created before the fix appear 1 hour LATER than intended.
--
-- WHAT THIS SCRIPT DOES:
--   Shifts startDateTime and endDateTime back by 1 hour for all affected records.
--
-- SAFETY:
--   1. Wrapped in a transaction — either all rows are fixed or none.
--   2. DRY-RUN mode by default — set DRY_RUN = false to apply changes.
--   3. Uses a cutoff timestamp — only rows created BEFORE the fix are affected.
--   4. Logs row counts before and after.
--
-- USAGE:
--   1. Connect to the production database:
--        psql $DATABASE_URL
--   2. Run in dry-run mode first (default) to preview:
--        \i apps/backend/scripts/fix-timezone-shift.sql
--   3. Review the output. If correct, set DRY_RUN = false and run again.
--
-- IMPORTANT: Run ONCE only. Running twice will shift times by -2h.
-- =============================================================================

-- ►►► CONFIGURATION — edit before running ◄◄◄

-- Set to false to apply changes. true = preview only (no data is changed).
\set DRY_RUN true

-- Timestamp of the last commit BEFORE the fix was deployed to production.
-- All reservations created at or before this moment are affected.
-- Adjust to match your actual deployment time (UTC).
\set CUTOFF_UTC '''2026-03-06 22:00:00+00'''

-- ►►► END CONFIGURATION ◄◄◄

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Count affected rows (preview)
-- -----------------------------------------------------------------------
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO affected_count
    FROM "Reservation"
   WHERE "createdAt" <= '2026-03-06 22:00:00+00'::timestamptz
     AND "startDateTime" IS NOT NULL;

  RAISE NOTICE '=== TIMEZONE SHIFT FIX ===';
  RAISE NOTICE 'Rows to be updated: %', affected_count;
  RAISE NOTICE 'Shift: -1 hour (UTC+1 Warsaw correction)';
END;
$$;

-- -----------------------------------------------------------------------
-- 2. Show sample of what will change (first 10 rows)
-- -----------------------------------------------------------------------
SELECT
  id,
  "createdAt"                                              AS created_at,
  "startDateTime"                                          AS start_current,
  "startDateTime" - INTERVAL '1 hour'                     AS start_after_fix,
  "endDateTime"                                            AS end_current,
  "endDateTime"   - INTERVAL '1 hour'                     AS end_after_fix
FROM "Reservation"
WHERE "createdAt" <= '2026-03-06 22:00:00+00'::timestamptz
  AND "startDateTime" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- -----------------------------------------------------------------------
-- 3. Apply the fix (only when DRY_RUN = false)
-- -----------------------------------------------------------------------
DO $$
DECLARE
  dry_run     BOOLEAN := current_setting('fix_tz.dry_run', true) = 'true';
  rows_updated INTEGER;
BEGIN
  -- Default to true (safe) if the setting was never overridden
  IF dry_run IS NULL THEN
    dry_run := true;
  END IF;

  IF dry_run THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  DRY-RUN MODE — no changes applied.';
    RAISE NOTICE 'To apply: run   SET fix_tz.dry_run = false;   before this script.';
    RAISE NOTICE '';
  ELSE
    UPDATE "Reservation"
       SET "startDateTime" = "startDateTime" - INTERVAL '1 hour',
           "endDateTime"   = "endDateTime"   - INTERVAL '1 hour"
     WHERE "createdAt" <= '2026-03-06 22:00:00+00'::timestamptz
       AND "startDateTime" IS NOT NULL;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Applied fix to % reservation(s).', rows_updated;
    RAISE NOTICE 'Commit this transaction to persist the changes.';
    RAISE NOTICE '';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------
-- 4. Commit or rollback
--    → COMMIT  to persist   (only makes sense when DRY_RUN = false)
--    → ROLLBACK for dry-run (default — leaves data untouched)
-- -----------------------------------------------------------------------
-- To apply:   replace ROLLBACK with COMMIT below, and set dry_run = false above.
ROLLBACK;

-- =============================================================================
-- QUICK-APPLY CHEAT SHEET
-- =============================================================================
--
--   psql $DATABASE_URL \\<<'SQL'
--     SET fix_tz.dry_run = false;
--     BEGIN;
--     UPDATE "Reservation"
--        SET "startDateTime" = "startDateTime" - INTERVAL '1 hour',
--            "endDateTime"   = "endDateTime"   - INTERVAL '1 hour'
--      WHERE "createdAt" <= '2026-03-06 22:00:00+00'
--        AND "startDateTime" IS NOT NULL;
--     -- verify row count, then:
--     COMMIT;
--   SQL
--
-- =============================================================================
