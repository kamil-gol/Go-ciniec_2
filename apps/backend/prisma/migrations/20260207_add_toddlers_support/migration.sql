-- AlterTable "Reservation" add columns for toddlers support
ALTER TABLE "Reservation" 
  ADD COLUMN IF NOT EXISTS "toddlers" SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pricePerToddler" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing reservations: set toddlers to 0 (default)
-- No data migration needed as this is a new feature

-- Add comment for documentation
COMMENT ON COLUMN "Reservation"."toddlers" IS 'Number of toddlers (0-3 years old)';
COMMENT ON COLUMN "Reservation"."pricePerToddler" IS 'Price per toddler (0-3 years old)';
COMMENT ON COLUMN "Reservation"."children" IS 'Number of children (4-12 years old)';
