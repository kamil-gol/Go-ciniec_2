-- CreateEnum
CREATE TYPE "CateringPriceType" AS ENUM ('PER_PERSON', 'FLAT', 'TIERED');

-- CreateTable
CREATE TABLE "CateringTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(100) NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringPackage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "shortDescription" VARCHAR(500),
    "priceType" "CateringPriceType" NOT NULL DEFAULT 'PER_PERSON',
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tieredPricing" JSONB,
    "badgeText" VARCHAR(50),
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minGuests" SMALLINT,
    "maxGuests" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringPackageSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "minSelect" SMALLINT NOT NULL DEFAULT 1,
    "maxSelect" SMALLINT NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringPackageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringSectionOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    "customPrice" DECIMAL(10,2),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringSectionOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CateringTemplate_slug_key" ON "CateringTemplate"("slug");

-- CreateIndex
CREATE INDEX "CateringTemplate_slug_idx" ON "CateringTemplate"("slug");

-- CreateIndex
CREATE INDEX "CateringTemplate_isActive_idx" ON "CateringTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CateringTemplate_displayOrder_idx" ON "CateringTemplate"("displayOrder");

-- CreateIndex
CREATE INDEX "CateringPackage_templateId_idx" ON "CateringPackage"("templateId");

-- CreateIndex
CREATE INDEX "CateringPackage_displayOrder_idx" ON "CateringPackage"("displayOrder");

-- CreateIndex
CREATE INDEX "CateringPackage_isActive_idx" ON "CateringPackage"("isActive");

-- CreateIndex
CREATE INDEX "CateringPackageSection_packageId_idx" ON "CateringPackageSection"("packageId");

-- CreateIndex
CREATE INDEX "CateringPackageSection_categoryId_idx" ON "CateringPackageSection"("categoryId");

-- CreateIndex
CREATE INDEX "CateringPackageSection_displayOrder_idx" ON "CateringPackageSection"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CateringPackageSection_packageId_categoryId_key" ON "CateringPackageSection"("packageId", "categoryId");

-- CreateIndex
CREATE INDEX "CateringSectionOption_sectionId_idx" ON "CateringSectionOption"("sectionId");

-- CreateIndex
CREATE INDEX "CateringSectionOption_dishId_idx" ON "CateringSectionOption"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "CateringSectionOption_sectionId_dishId_key" ON "CateringSectionOption"("sectionId", "dishId");

-- AddForeignKey
ALTER TABLE "CateringPackage" ADD CONSTRAINT "CateringPackage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CateringTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringPackageSection" ADD CONSTRAINT "CateringPackageSection_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CateringPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringPackageSection" ADD CONSTRAINT "CateringPackageSection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DishCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringSectionOption" ADD CONSTRAINT "CateringSectionOption_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CateringPackageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringSectionOption" ADD CONSTRAINT "CateringSectionOption_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
