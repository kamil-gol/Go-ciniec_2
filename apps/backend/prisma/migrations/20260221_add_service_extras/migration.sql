-- CreateTable: ServiceCategory
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(20),
    "color" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ServiceItem
CREATE TABLE "ServiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priceType" VARCHAR(20) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "icon" VARCHAR(50),
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "requiresNote" BOOLEAN NOT NULL DEFAULT false,
    "noteLabel" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReservationExtra
CREATE TABLE "ReservationExtra" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "serviceItemId" UUID NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "priceType" VARCHAR(20) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationExtra_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Reservation — add extrasTotalPrice
ALTER TABLE "Reservation" ADD COLUMN "extrasTotalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex: ServiceCategory
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_slug_idx" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_isActive_idx" ON "ServiceCategory"("isActive");
CREATE INDEX "ServiceCategory_displayOrder_idx" ON "ServiceCategory"("displayOrder");

-- CreateIndex: ServiceItem
CREATE INDEX "ServiceItem_categoryId_idx" ON "ServiceItem"("categoryId");
CREATE INDEX "ServiceItem_isActive_idx" ON "ServiceItem"("isActive");
CREATE INDEX "ServiceItem_displayOrder_idx" ON "ServiceItem"("displayOrder");
CREATE INDEX "ServiceItem_priceType_idx" ON "ServiceItem"("priceType");

-- CreateIndex: ReservationExtra
CREATE UNIQUE INDEX "ReservationExtra_reservationId_serviceItemId_key" ON "ReservationExtra"("reservationId", "serviceItemId");
CREATE INDEX "ReservationExtra_reservationId_idx" ON "ReservationExtra"("reservationId");
CREATE INDEX "ReservationExtra_serviceItemId_idx" ON "ReservationExtra"("serviceItemId");
CREATE INDEX "ReservationExtra_status_idx" ON "ReservationExtra"("status");

-- AddForeignKey: ServiceItem -> ServiceCategory
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ReservationExtra -> Reservation
ALTER TABLE "ReservationExtra" ADD CONSTRAINT "ReservationExtra_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ReservationExtra -> ServiceItem
ALTER TABLE "ReservationExtra" ADD CONSTRAINT "ReservationExtra_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
