-- Migration: Convert DishCategory from ENUM to dynamic model
-- This migration needs to be run AFTER creating the DishCategory table

-- Step 1: Create temporary column for old enum values
ALTER TABLE "Dish" ADD COLUMN IF NOT EXISTS "temp_category" VARCHAR(50);

-- Step 2: Copy enum values to temp column
UPDATE "Dish" SET "temp_category" = "category"::TEXT;

-- Step 3: Add categoryId column (will be populated after categories are seeded)
ALTER TABLE "Dish" ADD COLUMN IF NOT EXISTS "categoryId" UUID;

-- Step 4: Map old enum values to new category IDs
-- This will be done programmatically in the migration script
-- after DishCategory table is populated

-- Step 5: PackageCategorySettings migration
ALTER TABLE "PackageCategorySettings" ADD COLUMN IF NOT EXISTS "temp_category" VARCHAR(50);
UPDATE "PackageCategorySettings" SET "temp_category" = "category"::TEXT;
ALTER TABLE "PackageCategorySettings" ADD COLUMN IF NOT EXISTS "categoryId" UUID;

-- After running programmatic migration:
-- Step 6: Drop old enum column
-- ALTER TABLE "Dish" DROP COLUMN "category";
-- ALTER TABLE "PackageCategorySettings" DROP COLUMN "category";
-- DROP TYPE IF EXISTS "DishCategory";
