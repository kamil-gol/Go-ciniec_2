-- AlterTable: Add extraItemPrice and maxExtra to PackageCategorySettings
ALTER TABLE "PackageCategorySettings" ADD COLUMN "extraItemPrice" DECIMAL(10, 2);
ALTER TABLE "PackageCategorySettings" ADD COLUMN "maxExtra" SMALLINT;

-- CreateTable: ReservationCategoryExtra
CREATE TABLE "ReservationCategoryExtra" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "packageCategoryId" UUID NOT NULL,
    "quantity" SMALLINT NOT NULL,
    "pricePerItem" DECIMAL(10, 2) NOT NULL,
    "totalPrice" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationCategoryExtra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationCategoryExtra_reservationId_idx" ON "ReservationCategoryExtra"("reservationId");
CREATE INDEX "ReservationCategoryExtra_packageCategoryId_idx" ON "ReservationCategoryExtra"("packageCategoryId");
CREATE UNIQUE INDEX "ReservationCategoryExtra_reservationId_packageCategoryId_key" ON "ReservationCategoryExtra"("reservationId", "packageCategoryId");

-- AddForeignKey
ALTER TABLE "ReservationCategoryExtra" ADD CONSTRAINT "ReservationCategoryExtra_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationCategoryExtra" ADD CONSTRAINT "ReservationCategoryExtra_packageCategoryId_fkey" FOREIGN KEY ("packageCategoryId") REFERENCES "PackageCategorySettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
