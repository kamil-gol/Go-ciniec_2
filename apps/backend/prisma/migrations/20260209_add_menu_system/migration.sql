-- CreateTable: MenuTemplate
CREATE TABLE "MenuTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventTypeId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "variant" VARCHAR(100),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MenuPackage
CREATE TABLE "MenuPackage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menuTemplateId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "shortDescription" VARCHAR(500),
    "pricePerAdult" DECIMAL(10,2) NOT NULL,
    "pricePerChild" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pricePerToddler" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "badgeText" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "includedItems" TEXT[],
    "minGuests" SMALLINT,
    "maxGuests" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MenuOption
CREATE TABLE "MenuOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "shortDescription" VARCHAR(500),
    "category" VARCHAR(100) NOT NULL,
    "priceType" VARCHAR(20) NOT NULL,
    "priceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" SMALLINT NOT NULL DEFAULT 1,
    "icon" VARCHAR(50),
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MenuPackageOption
CREATE TABLE "MenuPackageOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "customPrice" DECIMAL(10,2),
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPackageOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReservationMenuSnapshot
CREATE TABLE "ReservationMenuSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "menuData" JSONB NOT NULL,
    "menuTemplateId" UUID,
    "packageId" UUID,
    "packagePrice" DECIMAL(10,2) NOT NULL,
    "optionsPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalMenuPrice" DECIMAL(10,2) NOT NULL,
    "adultsCount" SMALLINT NOT NULL,
    "childrenCount" SMALLINT NOT NULL,
    "toddlersCount" SMALLINT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationMenuSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MenuPriceHistory
CREATE TABLE "MenuPriceHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "menuTemplateId" UUID,
    "packageId" UUID,
    "optionId" UUID,
    "fieldName" VARCHAR(50) NOT NULL,
    "oldValue" DECIMAL(10,2) NOT NULL,
    "newValue" DECIMAL(10,2) NOT NULL,
    "changeReason" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: MenuTemplate
CREATE INDEX "MenuTemplate_eventTypeId_idx" ON "MenuTemplate"("eventTypeId");
CREATE INDEX "MenuTemplate_isActive_idx" ON "MenuTemplate"("isActive");
CREATE INDEX "MenuTemplate_validFrom_validTo_idx" ON "MenuTemplate"("validFrom", "validTo");
CREATE INDEX "MenuTemplate_variant_idx" ON "MenuTemplate"("variant");

-- CreateIndex: MenuPackage
CREATE INDEX "MenuPackage_menuTemplateId_idx" ON "MenuPackage"("menuTemplateId");
CREATE INDEX "MenuPackage_displayOrder_idx" ON "MenuPackage"("displayOrder");
CREATE INDEX "MenuPackage_isPopular_idx" ON "MenuPackage"("isPopular");

-- CreateIndex: MenuOption
CREATE INDEX "MenuOption_category_idx" ON "MenuOption"("category");
CREATE INDEX "MenuOption_isActive_idx" ON "MenuOption"("isActive");
CREATE INDEX "MenuOption_priceType_idx" ON "MenuOption"("priceType");

-- CreateIndex: MenuPackageOption
CREATE INDEX "MenuPackageOption_packageId_idx" ON "MenuPackageOption"("packageId");
CREATE INDEX "MenuPackageOption_optionId_idx" ON "MenuPackageOption"("optionId");
CREATE UNIQUE INDEX "MenuPackageOption_packageId_optionId_key" ON "MenuPackageOption"("packageId", "optionId");

-- CreateIndex: ReservationMenuSnapshot
CREATE UNIQUE INDEX "ReservationMenuSnapshot_reservationId_key" ON "ReservationMenuSnapshot"("reservationId");
CREATE INDEX "ReservationMenuSnapshot_reservationId_idx" ON "ReservationMenuSnapshot"("reservationId");
CREATE INDEX "ReservationMenuSnapshot_menuTemplateId_idx" ON "ReservationMenuSnapshot"("menuTemplateId");
CREATE INDEX "ReservationMenuSnapshot_packageId_idx" ON "ReservationMenuSnapshot"("packageId");
CREATE INDEX "ReservationMenuSnapshot_selectedAt_idx" ON "ReservationMenuSnapshot"("selectedAt");

-- CreateIndex: MenuPriceHistory
CREATE INDEX "MenuPriceHistory_entityType_entityId_idx" ON "MenuPriceHistory"("entityType", "entityId");
CREATE INDEX "MenuPriceHistory_menuTemplateId_idx" ON "MenuPriceHistory"("menuTemplateId");
CREATE INDEX "MenuPriceHistory_packageId_idx" ON "MenuPriceHistory"("packageId");
CREATE INDEX "MenuPriceHistory_optionId_idx" ON "MenuPriceHistory"("optionId");
CREATE INDEX "MenuPriceHistory_effectiveFrom_idx" ON "MenuPriceHistory"("effectiveFrom");

-- AddForeignKey
ALTER TABLE "MenuTemplate" ADD CONSTRAINT "MenuTemplate_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackage" ADD CONSTRAINT "MenuPackage_menuTemplateId_fkey" FOREIGN KEY ("menuTemplateId") REFERENCES "MenuTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackageOption" ADD CONSTRAINT "MenuPackageOption_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackageOption" ADD CONSTRAINT "MenuPackageOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationMenuSnapshot" ADD CONSTRAINT "ReservationMenuSnapshot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_menuTemplateId_fkey" FOREIGN KEY ("menuTemplateId") REFERENCES "MenuTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CHECK constraints
ALTER TABLE "MenuTemplate" ADD CONSTRAINT "check_valid_period" CHECK ("validFrom" < COALESCE("validTo", '9999-12-31'::TIMESTAMP));
ALTER TABLE "MenuPackage" ADD CONSTRAINT "check_positive_prices" CHECK ("pricePerAdult" >= 0 AND "pricePerChild" >= 0 AND "pricePerToddler" >= 0);
ALTER TABLE "MenuPackage" ADD CONSTRAINT "check_guest_limits" CHECK ("minGuests" IS NULL OR "maxGuests" IS NULL OR "minGuests" <= "maxGuests");
ALTER TABLE "MenuOption" ADD CONSTRAINT "check_price_type" CHECK ("priceType" IN ('PER_PERSON', 'FLAT', 'FREE'));
ALTER TABLE "MenuOption" ADD CONSTRAINT "check_max_quantity" CHECK ("maxQuantity" > 0);
ALTER TABLE "ReservationMenuSnapshot" ADD CONSTRAINT "check_positive_totals" CHECK ("packagePrice" >= 0 AND "optionsPrice" >= 0 AND "totalMenuPrice" >= 0);
