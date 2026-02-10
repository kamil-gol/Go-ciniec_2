-- Migration: From Course-based to Category-based Menu System
-- Date: 2026-02-10
-- Description: Removes MenuCourse/MenuCourseOption, adds PackageCategorySettings and AddonGroup

-- ============================================
-- STEP 1: Drop old course-based tables
-- ============================================

DROP TABLE IF EXISTS "MenuCourseOption" CASCADE;
DROP TABLE IF EXISTS "MenuCourse" CASCADE;

COMMENT ON SCHEMA public IS 'Dropped course-based menu system';

-- ============================================
-- STEP 2: Add ADDON to DishCategory enum
-- ============================================

ALTER TYPE "DishCategory" ADD VALUE IF NOT EXISTS 'ADDON';

COMMENT ON TYPE "DishCategory" IS 'Added ADDON category for paid extras';

-- ============================================
-- STEP 3: Create PackageCategorySettings table
-- ============================================

CREATE TABLE "PackageCategorySettings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "category" "DishCategory" NOT NULL,
    
    -- Selection limits
    "minSelect" SMALLINT NOT NULL DEFAULT 1,
    "maxSelect" SMALLINT NOT NULL DEFAULT 1,
    
    -- Behavior
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    
    -- UI
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "customLabel" VARCHAR(255),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "PackageCategorySettings_packageId_category_key" UNIQUE ("packageId", "category"),
    CONSTRAINT "PackageCategorySettings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for PackageCategorySettings
CREATE INDEX "PackageCategorySettings_packageId_idx" ON "PackageCategorySettings"("packageId");
CREATE INDEX "PackageCategorySettings_category_idx" ON "PackageCategorySettings"("category");

COMMENT ON TABLE "PackageCategorySettings" IS 'Category-based dish selection limits per package';

-- ============================================
-- STEP 4: Create AddonGroup table
-- ============================================

CREATE TABLE "AddonGroup" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    
    -- Selection limits
    "minSelect" SMALLINT NOT NULL DEFAULT 0,
    "maxSelect" SMALLINT NOT NULL DEFAULT 1,
    
    -- Pricing
    "priceType" VARCHAR(20) NOT NULL, -- 'PER_PERSON', 'FLAT', 'FREE'
    "basePrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- UI
    "icon" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes for AddonGroup
CREATE INDEX "AddonGroup_isActive_idx" ON "AddonGroup"("isActive");
CREATE INDEX "AddonGroup_displayOrder_idx" ON "AddonGroup"("displayOrder");

COMMENT ON TABLE "AddonGroup" IS 'Groups of paid addon dishes';

-- ============================================
-- STEP 5: Create AddonGroupDish junction table
-- ============================================

CREATE TABLE "AddonGroupDish" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    
    "customPrice" DECIMAL(10, 2),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "AddonGroupDish_groupId_dishId_key" UNIQUE ("groupId", "dishId"),
    CONSTRAINT "AddonGroupDish_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AddonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AddonGroupDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for AddonGroupDish
CREATE INDEX "AddonGroupDish_groupId_idx" ON "AddonGroupDish"("groupId");
CREATE INDEX "AddonGroupDish_dishId_idx" ON "AddonGroupDish"("dishId");

COMMENT ON TABLE "AddonGroupDish" IS 'Junction table: AddonGroup <-> Dish (ADDON category only)';

-- ============================================
-- STEP 6: Migrate existing data (if any)
-- ============================================

-- Create default category settings for existing packages
-- This ensures existing packages still work with the new system

INSERT INTO "PackageCategorySettings" (
    "packageId",
    "category",
    "minSelect",
    "maxSelect",
    "isRequired",
    "isEnabled",
    "displayOrder",
    "updatedAt"
)
SELECT 
    p."id" as "packageId",
    category_data.category,
    category_data."minSelect",
    category_data."maxSelect",
    category_data."isRequired",
    true as "isEnabled",
    category_data."displayOrder",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "MenuPackage" p
CROSS JOIN (
    VALUES 
        ('SOUP'::"DishCategory", 1, 2, true, 1),
        ('MAIN_COURSE'::"DishCategory", 1, 1, true, 2),
        ('SIDE_DISH'::"DishCategory", 2, 3, true, 3),
        ('SALAD'::"DishCategory", 1, 2, false, 4),
        ('DESSERT'::"DishCategory", 1, 2, true, 5)
) AS category_data(category, "minSelect", "maxSelect", "isRequired", "displayOrder")
ON CONFLICT ("packageId", "category") DO NOTHING;

COMMENT ON TABLE "PackageCategorySettings" IS 'Default category settings created for all existing packages';

-- ============================================
-- STEP 7: Update constraints and triggers
-- ============================================

-- Add trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_category_settings_updated_at BEFORE UPDATE ON "PackageCategorySettings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_group_updated_at BEFORE UPDATE ON "AddonGroup"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_group_dish_updated_at BEFORE UPDATE ON "AddonGroupDish"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: Grant permissions (if needed)
-- ============================================

-- Grant permissions to application user
-- GRANT ALL PRIVILEGES ON TABLE "PackageCategorySettings" TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE "AddonGroup" TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE "AddonGroupDish" TO your_app_user;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON SCHEMA public IS 'Migration to category-based menu system completed successfully';
