-- Migration: Refactor menu schema
-- 1. Remove unused fields from Dish
-- 2. Change PackageCategorySettings min/max to Decimal
-- 3. Make MenuTemplate validFrom/validTo nullable

-- 1. Drop columns from Dish table
ALTER TABLE "Dish" 
  DROP COLUMN IF EXISTS "priceModifier",
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "thumbnailUrl";

-- 2. Change PackageCategorySettings min/max to DECIMAL(4,1)
ALTER TABLE "PackageCategorySettings" 
  ALTER COLUMN "minSelect" TYPE DECIMAL(4,1),
  ALTER COLUMN "maxSelect" TYPE DECIMAL(4,1);

-- 3. Make MenuTemplate dates nullable
ALTER TABLE "MenuTemplate"
  ALTER COLUMN "validFrom" DROP NOT NULL,
  ALTER COLUMN "validTo" DROP NOT NULL;

-- Update existing data to handle half portions (example: convert integers to decimals)
-- This ensures existing min/max values remain valid
UPDATE "PackageCategorySettings" 
SET 
  "minSelect" = CAST("minSelect" AS DECIMAL(4,1)),
  "maxSelect" = CAST("maxSelect" AS DECIMAL(4,1));
