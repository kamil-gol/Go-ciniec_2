-- AlterTable: Add optional ServiceItem reference to CateringOrderExtra
ALTER TABLE "CateringOrderExtra" ADD COLUMN "serviceItemId" UUID;

-- AddForeignKey
ALTER TABLE "CateringOrderExtra" ADD CONSTRAINT "CateringOrderExtra_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CateringOrderExtra_serviceItemId_idx" ON "CateringOrderExtra"("serviceItemId");
