-- Menu Management System Migration
-- Created: 2026-02-09
-- Description: Adds menu templates, packages, options, and snapshot architecture

-- 1. MenuTemplate - Template for event-specific menus
CREATE TABLE "MenuTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventTypeId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  
  -- Validity period
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  
  -- UI/UX
  "displayOrder" SMALLINT NOT NULL DEFAULT 0,
  "imageUrl" TEXT,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MenuTemplate_eventTypeId_fkey" 
    FOREIGN KEY ("eventTypeId") 
    REFERENCES "EventType"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 2. MenuPackage - Package within a menu (Basic, Standard, Premium)
CREATE TABLE "MenuPackage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "menuTemplateId" UUID NOT NULL,
  
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  
  -- Pricing
  "pricePerAdult" DECIMAL(10, 2) NOT NULL,
  "pricePerChild" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "pricePerToddler" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- UI/UX
  "color" VARCHAR(20),
  "icon" VARCHAR(50),
  "displayOrder" SMALLINT NOT NULL DEFAULT 0,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  
  -- Included items
  "includedItems" TEXT[] NOT NULL DEFAULT '{}',
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MenuPackage_menuTemplateId_fkey" 
    FOREIGN KEY ("menuTemplateId") 
    REFERENCES "MenuTemplate"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. MenuOption - Available options (DJ, Bar, Photographer, etc.)
CREATE TABLE "MenuOption" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100) NOT NULL,
  
  -- Pricing
  "priceType" VARCHAR(20) NOT NULL CHECK ("priceType" IN ('PER_PERSON', 'FLAT', 'FREE')),
  "priceAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- UI/UX
  "icon" VARCHAR(50),
  "imageUrl" TEXT,
  
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. MenuPackageOption - Junction table (which options are available in which packages)
CREATE TABLE "MenuPackageOption" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "packageId" UUID NOT NULL,
  "optionId" UUID NOT NULL,
  
  -- Option overrides for this package
  "customPrice" DECIMAL(10, 2),
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  
  "displayOrder" SMALLINT NOT NULL DEFAULT 0,
  
  CONSTRAINT "MenuPackageOption_packageId_fkey" 
    FOREIGN KEY ("packageId") 
    REFERENCES "MenuPackage"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT "MenuPackageOption_optionId_fkey" 
    FOREIGN KEY ("optionId") 
    REFERENCES "MenuOption"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT "MenuPackageOption_packageId_optionId_unique" 
    UNIQUE ("packageId", "optionId")
);

-- 5. ReservationMenuSnapshot - Immutable snapshot of selected menu
CREATE TABLE "ReservationMenuSnapshot" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reservationId" UUID NOT NULL UNIQUE,
  
  -- Snapshot data (complete JSON copy)
  "menuData" JSONB NOT NULL,
  
  -- References (may be null if template/package deleted)
  "menuTemplateId" UUID,
  "packageId" UUID,
  
  -- Calculated totals
  "packagePrice" DECIMAL(10, 2) NOT NULL,
  "optionsPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "totalMenuPrice" DECIMAL(10, 2) NOT NULL,
  
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ReservationMenuSnapshot_reservationId_fkey" 
    FOREIGN KEY ("reservationId") 
    REFERENCES "Reservation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "MenuTemplate_eventTypeId_idx" ON "MenuTemplate"("eventTypeId");
CREATE INDEX "MenuTemplate_isActive_idx" ON "MenuTemplate"("isActive");
CREATE INDEX "MenuTemplate_validFrom_validTo_idx" ON "MenuTemplate"("validFrom", "validTo");

CREATE INDEX "MenuPackage_menuTemplateId_idx" ON "MenuPackage"("menuTemplateId");
CREATE INDEX "MenuPackage_displayOrder_idx" ON "MenuPackage"("displayOrder");

CREATE INDEX "MenuOption_category_idx" ON "MenuOption"("category");
CREATE INDEX "MenuOption_isActive_idx" ON "MenuOption"("isActive");

CREATE INDEX "MenuPackageOption_packageId_idx" ON "MenuPackageOption"("packageId");
CREATE INDEX "MenuPackageOption_optionId_idx" ON "MenuPackageOption"("optionId");

CREATE INDEX "ReservationMenuSnapshot_reservationId_idx" ON "ReservationMenuSnapshot"("reservationId");
CREATE INDEX "ReservationMenuSnapshot_menuTemplateId_idx" ON "ReservationMenuSnapshot"("menuTemplateId");
CREATE INDEX "ReservationMenuSnapshot_selectedAt_idx" ON "ReservationMenuSnapshot"("selectedAt");

-- Comments for documentation
COMMENT ON TABLE "MenuTemplate" IS 'Menu templates valid for specific time periods and event types';
COMMENT ON TABLE "MenuPackage" IS 'Packages within a menu (Basic, Standard, Premium, etc.)';
COMMENT ON TABLE "MenuOption" IS 'Additional options available for selection (DJ, Bar, Photography, etc.)';
COMMENT ON TABLE "MenuPackageOption" IS 'Junction table defining which options are available for which packages';
COMMENT ON TABLE "ReservationMenuSnapshot" IS 'Immutable snapshot of menu selection at time of reservation (preserves historical pricing)';

COMMENT ON COLUMN "MenuOption"."priceType" IS 'PER_PERSON: multiplied by guest count, FLAT: fixed price, FREE: no charge';
COMMENT ON COLUMN "ReservationMenuSnapshot"."menuData" IS 'Complete JSON snapshot of menu, package, and selected options at time of selection';
