-- Migration: Move isExclusive from ServiceItem to ServiceCategory
-- Date: 2026-02-23
-- Description: Przeniesienie flagi isExclusive z poziomu pozycji na poziom kategorii

-- Step 1: Add isExclusive to ServiceCategory
ALTER TABLE "ServiceCategory" ADD COLUMN "isExclusive" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Migrate data — set category as exclusive if ANY of its items was exclusive
UPDATE "ServiceCategory"
SET "isExclusive" = true
WHERE "id" IN (
  SELECT DISTINCT "categoryId"
  FROM "ServiceItem"
  WHERE "isExclusive" = true
);

-- Step 3: Drop isExclusive from ServiceItem
ALTER TABLE "ServiceItem" DROP COLUMN "isExclusive";
