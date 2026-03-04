-- ═══════════════════════════════════════════════════════════════
-- Migration: Catering Phase 2 — Orders
-- Issue: #150
-- ═══════════════════════════════════════════════════════════════

-- Enums
CREATE TYPE "CateringOrderStatus" AS ENUM (
  'DRAFT',
  'INQUIRY',
  'QUOTED',
  'CONFIRMED',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "CateringDeliveryType" AS ENUM (
  'PICKUP',
  'DELIVERY',
  'ON_SITE'
);

CREATE TYPE "CateringDiscountType" AS ENUM (
  'PERCENTAGE',
  'AMOUNT'
);

-- CateringOrder
CREATE TABLE "CateringOrder" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderNumber"      VARCHAR(20) NOT NULL,
  "clientId"         UUID NOT NULL,
  "createdById"      UUID NOT NULL,
  "templateId"       UUID,
  "packageId"        UUID,
  "status"           "CateringOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "deliveryType"     "CateringDeliveryType" NOT NULL DEFAULT 'ON_SITE',
  "eventName"        VARCHAR(255),
  "eventDate"        VARCHAR(10),
  "eventTime"        VARCHAR(5),
  "eventLocation"    VARCHAR(255),
  "guestsCount"      SMALLINT NOT NULL DEFAULT 0,
  "deliveryAddress"  TEXT,
  "deliveryNotes"    TEXT,
  "deliveryDate"     VARCHAR(10),
  "deliveryTime"     VARCHAR(5),
  "subtotal"         DECIMAL(10,2) NOT NULL DEFAULT 0,
  "extrasTotalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discountType"     "CateringDiscountType",
  "discountValue"    DECIMAL(10,2),
  "discountAmount"   DECIMAL(10,2),
  "discountReason"   TEXT,
  "totalPrice"       DECIMAL(10,2) NOT NULL DEFAULT 0,
  "contactName"      VARCHAR(200),
  "contactPhone"     VARCHAR(20),
  "contactEmail"     VARCHAR(255),
  "notes"            TEXT,
  "internalNotes"    TEXT,
  "specialRequirements" TEXT,
  "quoteExpiresAt"   TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CateringOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CateringOrder_orderNumber_key" ON "CateringOrder"("orderNumber");
CREATE INDEX "CateringOrder_clientId_idx" ON "CateringOrder"("clientId");
CREATE INDEX "CateringOrder_createdById_idx" ON "CateringOrder"("createdById");
CREATE INDEX "CateringOrder_status_idx" ON "CateringOrder"("status");
CREATE INDEX "CateringOrder_deliveryType_idx" ON "CateringOrder"("deliveryType");
CREATE INDEX "CateringOrder_eventDate_idx" ON "CateringOrder"("eventDate");
CREATE INDEX "CateringOrder_createdAt_idx" ON "CateringOrder"("createdAt");
CREATE INDEX "CateringOrder_templateId_idx" ON "CateringOrder"("templateId");
CREATE INDEX "CateringOrder_packageId_idx" ON "CateringOrder"("packageId");

-- CateringOrderItem
CREATE TABLE "CateringOrderItem" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderId"          UUID NOT NULL,
  "dishId"           UUID NOT NULL,
  "quantity"         SMALLINT NOT NULL DEFAULT 1,
  "unitPrice"        DECIMAL(10,2) NOT NULL,
  "totalPrice"       DECIMAL(10,2) NOT NULL,
  "note"             TEXT,
  "dishNameSnapshot" VARCHAR(255) NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CateringOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CateringOrderItem_orderId_idx" ON "CateringOrderItem"("orderId");
CREATE INDEX "CateringOrderItem_dishId_idx" ON "CateringOrderItem"("dishId");

-- CateringOrderExtra
CREATE TABLE "CateringOrderExtra" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderId"     UUID NOT NULL,
  "name"        VARCHAR(255) NOT NULL,
  "description" TEXT,
  "quantity"    SMALLINT NOT NULL DEFAULT 1,
  "unitPrice"   DECIMAL(10,2) NOT NULL,
  "totalPrice"  DECIMAL(10,2) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CateringOrderExtra_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CateringOrderExtra_orderId_idx" ON "CateringOrderExtra"("orderId");

-- CateringOrderHistory
CREATE TABLE "CateringOrderHistory" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderId"     UUID NOT NULL,
  "changedById" UUID NOT NULL,
  "changeType"  VARCHAR(30) NOT NULL,
  "fieldName"   VARCHAR(100),
  "oldValue"    TEXT,
  "newValue"    TEXT,
  "reason"      TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CateringOrderHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CateringOrderHistory_orderId_idx" ON "CateringOrderHistory"("orderId");
CREATE INDEX "CateringOrderHistory_changedById_idx" ON "CateringOrderHistory"("changedById");
CREATE INDEX "CateringOrderHistory_createdAt_idx" ON "CateringOrderHistory"("createdAt");

-- CateringDeposit
CREATE TABLE "CateringDeposit" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderId"         UUID NOT NULL,
  "amount"          DECIMAL(10,2) NOT NULL,
  "paidAmount"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "remainingAmount" DECIMAL(10,2) NOT NULL,
  "dueDate"         VARCHAR(10) NOT NULL,
  "status"          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "paid"            BOOLEAN NOT NULL DEFAULT false,
  "paidAt"          TIMESTAMP(3),
  "paymentMethod"   VARCHAR(50),
  "title"           VARCHAR(255),
  "description"     TEXT,
  "internalNotes"   TEXT,
  "receiptNumber"   VARCHAR(50),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CateringDeposit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CateringDeposit_receiptNumber_key" ON "CateringDeposit"("receiptNumber") WHERE "receiptNumber" IS NOT NULL;
CREATE INDEX "CateringDeposit_orderId_idx" ON "CateringDeposit"("orderId");
CREATE INDEX "CateringDeposit_dueDate_idx" ON "CateringDeposit"("dueDate");
CREATE INDEX "CateringDeposit_status_idx" ON "CateringDeposit"("status");
CREATE INDEX "CateringDeposit_paid_idx" ON "CateringDeposit"("paid");

-- Sekwencja auto-numeracji zamówień (CAT-YYYY-XXXXX)
CREATE SEQUENCE IF NOT EXISTS catering_order_seq START 1;

-- Foreign Keys
ALTER TABLE "CateringOrder"
  ADD CONSTRAINT "CateringOrder_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "CateringOrder_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "CateringOrder_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "CateringTemplate"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "CateringOrder_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "CateringPackage"("id") ON DELETE SET NULL;

ALTER TABLE "CateringOrderItem"
  ADD CONSTRAINT "CateringOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CateringOrder"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "CateringOrderItem_dishId_fkey"
    FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT;

ALTER TABLE "CateringOrderExtra"
  ADD CONSTRAINT "CateringOrderExtra_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CateringOrder"("id") ON DELETE CASCADE;

ALTER TABLE "CateringOrderHistory"
  ADD CONSTRAINT "CateringOrderHistory_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CateringOrder"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "CateringOrderHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT;

ALTER TABLE "CateringDeposit"
  ADD CONSTRAINT "CateringDeposit_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CateringOrder"("id") ON DELETE CASCADE;
