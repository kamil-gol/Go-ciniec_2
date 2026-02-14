-- RemoveHallPricing
-- Drop pricing columns from Hall table (pricing now lives on MenuPackage/Reservation)

ALTER TABLE "Hall" DROP COLUMN IF EXISTS "pricePerPerson";
ALTER TABLE "Hall" DROP COLUMN IF EXISTS "pricePerChild";
ALTER TABLE "Hall" DROP COLUMN IF EXISTS "pricePerToddler";
