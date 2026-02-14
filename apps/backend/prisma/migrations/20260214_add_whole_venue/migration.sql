-- Add isWholeVenue flag to Hall
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "isWholeVenue" BOOLEAN NOT NULL DEFAULT false;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS "Hall_isWholeVenue_idx" ON "Hall"("isWholeVenue");

-- Set the flag on the existing "Cały Obiekt" hall
UPDATE "Hall" SET "isWholeVenue" = true WHERE name = 'Cały Obiekt';
