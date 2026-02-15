-- ══════════════════════════════════════════════════════════════════
-- BASELINE MIGRATION - Squashed from all previous migrations
-- Generated: 2026-02-15
-- This single migration represents the complete current schema.
-- ══════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- ══════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════

-- CreateTable: User
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Hall
CREATE TABLE "Hall" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "capacity" SMALLINT NOT NULL,
    "description" TEXT,
    "amenities" TEXT[],
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isWholeVenue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EventType
CREATE TABLE "EventType" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Client
CREATE TABLE "Client" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reservation
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "reservationQueuePosition" SMALLINT,
    "reservationQueueDate" TIMESTAMP(3),
    "queueOrderManual" BOOLEAN NOT NULL DEFAULT false,
    "hallId" UUID,
    "eventTypeId" UUID,
    "date" VARCHAR(10),
    "startTime" VARCHAR(5),
    "endTime" VARCHAR(5),
    "startDateTime" TIMESTAMP(3),
    "endDateTime" TIMESTAMP(3),
    "adults" SMALLINT NOT NULL DEFAULT 0,
    "children" SMALLINT NOT NULL DEFAULT 0,
    "toddlers" SMALLINT NOT NULL DEFAULT 0,
    "guests" SMALLINT NOT NULL,
    "pricePerAdult" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pricePerChild" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pricePerToddler" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "confirmationDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "customEventType" VARCHAR(100),
    "birthdayAge" SMALLINT,
    "anniversaryYear" SMALLINT,
    "anniversaryOccasion" VARCHAR(100),
    "attachments" TEXT[],
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReservationHistory
CREATE TABLE "ReservationHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "changedByUserId" UUID NOT NULL,
    "changeType" VARCHAR(20) NOT NULL,
    "fieldName" VARCHAR(100),
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReservationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Deposit
CREATE TABLE "Deposit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "remainingAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dueDate" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" VARCHAR(50),
    "title" VARCHAR(255),
    "description" TEXT,
    "internalNotes" TEXT,
    "receiptNumber" VARCHAR(50),
    "confirmationPdfUrl" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DepositPayment
CREATE TABLE "DepositPayment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "depositId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" VARCHAR(50),
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepositPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ActivityLog
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50),
    "entityId" VARCHAR(100),
    "details" JSONB,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MenuTemplate
CREATE TABLE "MenuTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventTypeId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "variant" VARCHAR(100),
    "validFrom" TIMESTAMP(3),
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

-- CreateTable: DishCategory
CREATE TABLE "DishCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(20),
    "color" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DishCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Dish
CREATE TABLE "Dish" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "allergens" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PackageCategorySettings
CREATE TABLE "PackageCategorySettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "minSelect" DECIMAL(4,1) NOT NULL DEFAULT 1,
    "maxSelect" DECIMAL(4,1) NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "customLabel" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PackageCategorySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AddonGroup
CREATE TABLE "AddonGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "minSelect" SMALLINT NOT NULL DEFAULT 0,
    "maxSelect" SMALLINT NOT NULL DEFAULT 1,
    "priceType" VARCHAR(20) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "icon" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AddonGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AddonGroupDish
CREATE TABLE "AddonGroupDish" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "groupId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    "customPrice" DECIMAL(10,2),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AddonGroupDish_pkey" PRIMARY KEY ("id")
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

-- CreateTable: Attachment
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255),
    "originalName" VARCHAR(255) NOT NULL,
    "storedName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "version" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- ══════════════════════════════════════════════════════════════════
-- UNIQUE INDEXES
-- ══════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Hall_name_key" ON "Hall"("name");
CREATE UNIQUE INDEX "EventType_name_key" ON "EventType"("name");
CREATE UNIQUE INDEX "DishCategory_slug_key" ON "DishCategory"("slug");
CREATE UNIQUE INDEX "MenuPackageOption_packageId_optionId_key" ON "MenuPackageOption"("packageId", "optionId");
CREATE UNIQUE INDEX "PackageCategorySettings_packageId_categoryId_key" ON "PackageCategorySettings"("packageId", "categoryId");
CREATE UNIQUE INDEX "AddonGroupDish_groupId_dishId_key" ON "AddonGroupDish"("groupId", "dishId");
CREATE UNIQUE INDEX "ReservationMenuSnapshot_reservationId_key" ON "ReservationMenuSnapshot"("reservationId");
CREATE UNIQUE INDEX "Deposit_receiptNumber_key" ON "Deposit"("receiptNumber");

-- ══════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Hall_name_idx" ON "Hall"("name");
CREATE INDEX "Hall_isActive_idx" ON "Hall"("isActive");
CREATE INDEX "Hall_isWholeVenue_idx" ON "Hall"("isWholeVenue");
CREATE INDEX "EventType_name_idx" ON "EventType"("name");
CREATE INDEX "EventType_isActive_idx" ON "EventType"("isActive");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_phone_idx" ON "Client"("phone");
CREATE INDEX "Client_firstName_lastName_idx" ON "Client"("firstName", "lastName");
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");
CREATE INDEX "Reservation_startDateTime_idx" ON "Reservation"("startDateTime");
CREATE INDEX "Reservation_reservationQueueDate_idx" ON "Reservation"("reservationQueueDate");
CREATE INDEX "Reservation_reservationQueuePosition_idx" ON "Reservation"("reservationQueuePosition");
CREATE INDEX "Reservation_hallId_idx" ON "Reservation"("hallId");
CREATE INDEX "Reservation_clientId_idx" ON "Reservation"("clientId");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");
CREATE INDEX "Reservation_confirmationDeadline_idx" ON "Reservation"("confirmationDeadline");
CREATE INDEX "Reservation_queueOrderManual_idx" ON "Reservation"("queueOrderManual");
CREATE INDEX "ReservationHistory_reservationId_idx" ON "ReservationHistory"("reservationId");
CREATE INDEX "ReservationHistory_changedByUserId_idx" ON "ReservationHistory"("changedByUserId");
CREATE INDEX "ReservationHistory_createdAt_idx" ON "ReservationHistory"("createdAt");
CREATE INDEX "Deposit_reservationId_idx" ON "Deposit"("reservationId");
CREATE INDEX "Deposit_dueDate_idx" ON "Deposit"("dueDate");
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");
CREATE INDEX "Deposit_paid_idx" ON "Deposit"("paid");
CREATE INDEX "Deposit_receiptNumber_idx" ON "Deposit"("receiptNumber");
CREATE INDEX "Deposit_reminderSentAt_idx" ON "Deposit"("reminderSentAt");
CREATE INDEX "DepositPayment_depositId_idx" ON "DepositPayment"("depositId");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "MenuTemplate_eventTypeId_idx" ON "MenuTemplate"("eventTypeId");
CREATE INDEX "MenuTemplate_isActive_idx" ON "MenuTemplate"("isActive");
CREATE INDEX "MenuTemplate_validFrom_validTo_idx" ON "MenuTemplate"("validFrom", "validTo");
CREATE INDEX "MenuTemplate_variant_idx" ON "MenuTemplate"("variant");
CREATE INDEX "MenuPackage_menuTemplateId_idx" ON "MenuPackage"("menuTemplateId");
CREATE INDEX "MenuPackage_displayOrder_idx" ON "MenuPackage"("displayOrder");
CREATE INDEX "MenuPackage_isPopular_idx" ON "MenuPackage"("isPopular");
CREATE INDEX "MenuOption_category_idx" ON "MenuOption"("category");
CREATE INDEX "MenuOption_isActive_idx" ON "MenuOption"("isActive");
CREATE INDEX "MenuOption_priceType_idx" ON "MenuOption"("priceType");
CREATE INDEX "MenuPackageOption_packageId_idx" ON "MenuPackageOption"("packageId");
CREATE INDEX "MenuPackageOption_optionId_idx" ON "MenuPackageOption"("optionId");
CREATE INDEX "DishCategory_slug_idx" ON "DishCategory"("slug");
CREATE INDEX "DishCategory_isActive_idx" ON "DishCategory"("isActive");
CREATE INDEX "DishCategory_displayOrder_idx" ON "DishCategory"("displayOrder");
CREATE INDEX "Dish_categoryId_idx" ON "Dish"("categoryId");
CREATE INDEX "Dish_isActive_idx" ON "Dish"("isActive");
CREATE INDEX "Dish_name_idx" ON "Dish"("name");
CREATE INDEX "PackageCategorySettings_packageId_idx" ON "PackageCategorySettings"("packageId");
CREATE INDEX "PackageCategorySettings_categoryId_idx" ON "PackageCategorySettings"("categoryId");
CREATE INDEX "AddonGroup_isActive_idx" ON "AddonGroup"("isActive");
CREATE INDEX "AddonGroup_displayOrder_idx" ON "AddonGroup"("displayOrder");
CREATE INDEX "AddonGroupDish_groupId_idx" ON "AddonGroupDish"("groupId");
CREATE INDEX "AddonGroupDish_dishId_idx" ON "AddonGroupDish"("dishId");
CREATE INDEX "ReservationMenuSnapshot_reservationId_idx" ON "ReservationMenuSnapshot"("reservationId");
CREATE INDEX "ReservationMenuSnapshot_menuTemplateId_idx" ON "ReservationMenuSnapshot"("menuTemplateId");
CREATE INDEX "ReservationMenuSnapshot_packageId_idx" ON "ReservationMenuSnapshot"("packageId");
CREATE INDEX "ReservationMenuSnapshot_selectedAt_idx" ON "ReservationMenuSnapshot"("selectedAt");
CREATE INDEX "MenuPriceHistory_entityType_entityId_idx" ON "MenuPriceHistory"("entityType", "entityId");
CREATE INDEX "MenuPriceHistory_menuTemplateId_idx" ON "MenuPriceHistory"("menuTemplateId");
CREATE INDEX "MenuPriceHistory_packageId_idx" ON "MenuPriceHistory"("packageId");
CREATE INDEX "MenuPriceHistory_optionId_idx" ON "MenuPriceHistory"("optionId");
CREATE INDEX "MenuPriceHistory_effectiveFrom_idx" ON "MenuPriceHistory"("effectiveFrom");
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");
CREATE INDEX "Attachment_category_idx" ON "Attachment"("category");
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");

-- ══════════════════════════════════════════════════════════════════
-- FOREIGN KEYS
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservationHistory" ADD CONSTRAINT "ReservationHistory_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationHistory" ADD CONSTRAINT "ReservationHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepositPayment" ADD CONSTRAINT "DepositPayment_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MenuTemplate" ADD CONSTRAINT "MenuTemplate_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPackage" ADD CONSTRAINT "MenuPackage_menuTemplateId_fkey" FOREIGN KEY ("menuTemplateId") REFERENCES "MenuTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPackageOption" ADD CONSTRAINT "MenuPackageOption_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPackageOption" ADD CONSTRAINT "MenuPackageOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DishCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageCategorySettings" ADD CONSTRAINT "PackageCategorySettings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackageCategorySettings" ADD CONSTRAINT "PackageCategorySettings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DishCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AddonGroupDish" ADD CONSTRAINT "AddonGroupDish_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AddonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AddonGroupDish" ADD CONSTRAINT "AddonGroupDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationMenuSnapshot" ADD CONSTRAINT "ReservationMenuSnapshot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_menuTemplateId_fkey" FOREIGN KEY ("menuTemplateId") REFERENCES "MenuTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuPriceHistory" ADD CONSTRAINT "MenuPriceHistory_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════
-- QUEUE SYSTEM: PostgreSQL Functions & Triggers
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION recalculate_queue_positions(
  p_queue_date TIMESTAMP,
  p_exclude_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_reservation RECORD;
  v_position INTEGER := 1;
BEGIN
  FOR v_reservation IN
    SELECT "id"
    FROM "Reservation"
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(p_queue_date)
      AND "queueOrderManual" = false
      AND (p_exclude_id IS NULL OR "id" != p_exclude_id)
    ORDER BY "createdAt" ASC
  LOOP
    UPDATE "Reservation"
    SET "reservationQueuePosition" = v_position
    WHERE "id" = v_reservation."id";
    v_position := v_position + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_recalculate_queue_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."status" = 'RESERVED' AND NEW."status" != 'RESERVED' THEN
    IF OLD."queueOrderManual" = false THEN
      PERFORM recalculate_queue_positions(OLD."reservationQueueDate", OLD."id");
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_queue_on_status_change
AFTER UPDATE OF "status" ON "Reservation"
FOR EACH ROW
WHEN (OLD."status" IS DISTINCT FROM NEW."status")
EXECUTE FUNCTION trigger_recalculate_queue_on_status_change();

CREATE OR REPLACE FUNCTION swap_queue_positions(
  p_reservation_id_1 UUID,
  p_reservation_id_2 UUID
) RETURNS void AS $$
DECLARE
  v_pos_1 INTEGER;
  v_pos_2 INTEGER;
  v_date_1 TIMESTAMP;
  v_date_2 TIMESTAMP;
BEGIN
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_1, v_date_1
  FROM "Reservation"
  WHERE "id" = p_reservation_id_1 AND "status" = 'RESERVED';

  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_pos_2, v_date_2
  FROM "Reservation"
  WHERE "id" = p_reservation_id_2 AND "status" = 'RESERVED';

  IF v_pos_1 IS NULL OR v_pos_2 IS NULL THEN
    RAISE EXCEPTION 'One or both reservations not found or not in RESERVED status';
  END IF;

  IF DATE(v_date_1) != DATE(v_date_2) THEN
    RAISE EXCEPTION 'Reservations must be for the same date to swap positions';
  END IF;

  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_2, "queueOrderManual" = true
  WHERE "id" = p_reservation_id_1;

  UPDATE "Reservation"
  SET "reservationQueuePosition" = v_pos_1, "queueOrderManual" = true
  WHERE "id" = p_reservation_id_2;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION move_to_queue_position(
  p_reservation_id UUID,
  p_new_position INTEGER
) RETURNS void AS $$
DECLARE
  v_old_position INTEGER;
  v_queue_date TIMESTAMP;
  v_max_position INTEGER;
BEGIN
  SELECT "reservationQueuePosition", "reservationQueueDate"
  INTO v_old_position, v_queue_date
  FROM "Reservation"
  WHERE "id" = p_reservation_id AND "status" = 'RESERVED';

  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Reservation not found or not in RESERVED status';
  END IF;

  SELECT COALESCE(MAX("reservationQueuePosition"), 0)
  INTO v_max_position
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") = DATE(v_queue_date);

  IF p_new_position < 1 OR p_new_position > v_max_position THEN
    RAISE EXCEPTION 'Invalid position. Must be between 1 and %', v_max_position;
  END IF;

  IF p_new_position < v_old_position THEN
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" + 1, "queueOrderManual" = true
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(v_queue_date)
      AND "reservationQueuePosition" >= p_new_position
      AND "reservationQueuePosition" < v_old_position;
  ELSIF p_new_position > v_old_position THEN
    UPDATE "Reservation"
    SET "reservationQueuePosition" = "reservationQueuePosition" - 1, "queueOrderManual" = true
    WHERE "status" = 'RESERVED'
      AND DATE("reservationQueueDate") = DATE(v_queue_date)
      AND "reservationQueuePosition" > v_old_position
      AND "reservationQueuePosition" <= p_new_position;
  END IF;

  UPDATE "Reservation"
  SET "reservationQueuePosition" = p_new_position, "queueOrderManual" = true
  WHERE "id" = p_reservation_id;
END;
$$ LANGUAGE plpgsql;
