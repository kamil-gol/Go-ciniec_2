-- Fix ReservationHistory foreign key constraint
-- Rename changedBy to changedByUserId to match schema

BEGIN;

-- Drop the old foreign key constraint
ALTER TABLE "ReservationHistory" DROP CONSTRAINT IF EXISTS "ReservationHistory_changedBy_fkey";

-- Rename the column if it exists as 'changedBy'
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='ReservationHistory' AND column_name='changedBy'
  ) THEN
    ALTER TABLE "ReservationHistory" RENAME COLUMN "changedBy" TO "changedByUserId";
  END IF;
END $$;

-- Add the new foreign key constraint with correct column name
ALTER TABLE "ReservationHistory" 
  ADD CONSTRAINT "ReservationHistory_changedByUserId_fkey" 
  FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Recreate index with correct column name
DROP INDEX IF EXISTS "ReservationHistory_changedBy_idx";
CREATE INDEX IF NOT EXISTS "ReservationHistory_changedByUserId_idx" ON "ReservationHistory"("changedByUserId");

COMMIT;
