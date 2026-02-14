-- Add isWholeVenue flag to Hall
ALTER TABLE "Hall" ADD COLUMN "isWholeVenue" BOOLEAN NOT NULL DEFAULT false;

-- Create index for quick lookups
CREATE INDEX "Hall_isWholeVenue_idx" ON "Hall"("isWholeVenue");

-- Set the flag on the "Cały Obiekt" hall
UPDATE "Hall" SET "isWholeVenue" = true WHERE name = 'Cały Obiekt';
