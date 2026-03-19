-- #216: Category extras refactoring — per-person pricing model
-- Changes:
-- 1. ReservationCategoryExtra.quantity: SmallInt → Decimal(4,1) for fractional quantities
-- 2. ReservationCategoryExtra: add guestCount and portionTarget for per-person pricing
-- 3. PackageCategorySettings.maxExtra: SmallInt → Decimal(4,1) for fractional extras

-- Step 1: Alter quantity column to support fractional values (0.5, 1.5, etc.)
ALTER TABLE "ReservationCategoryExtra"
  ALTER COLUMN "quantity" TYPE DECIMAL(4, 1) USING "quantity"::DECIMAL(4, 1);

-- Step 2: Add guestCount snapshot (defaults to 1 for backward compatibility)
ALTER TABLE "ReservationCategoryExtra"
  ADD COLUMN "guestCount" INT NOT NULL DEFAULT 1;

-- Step 3: Add portionTarget snapshot
ALTER TABLE "ReservationCategoryExtra"
  ADD COLUMN "portionTarget" VARCHAR(20) NOT NULL DEFAULT 'ALL';

-- Step 4: Alter maxExtra column on PackageCategorySettings to support fractional values
ALTER TABLE "PackageCategorySettings"
  ALTER COLUMN "maxExtra" TYPE DECIMAL(4, 1) USING "maxExtra"::DECIMAL(4, 1);
