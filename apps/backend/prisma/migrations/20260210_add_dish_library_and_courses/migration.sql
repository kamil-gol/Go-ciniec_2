-- CreateEnum
CREATE TYPE "DishCategory" AS ENUM ('SOUP', 'MAIN_COURSE', 'MEAT', 'SIDE_DISH', 'SALAD', 'APPETIZER', 'DESSERT', 'DRINK', 'COLD_CUTS', 'SNACK', 'BREAKFAST', 'OTHER');

-- CreateTable
CREATE TABLE "Dish" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" "DishCategory" NOT NULL,
    "allergens" TEXT[],
    "priceModifier" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCourse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "minSelect" SMALLINT NOT NULL DEFAULT 1,
    "maxSelect" SMALLINT NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "icon" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCourseOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    "customPrice" DECIMAL(10,2),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCourseOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dish_category_idx" ON "Dish"("category");

-- CreateIndex
CREATE INDEX "Dish_isActive_idx" ON "Dish"("isActive");

-- CreateIndex
CREATE INDEX "Dish_name_idx" ON "Dish"("name");

-- CreateIndex
CREATE INDEX "MenuCourse_packageId_idx" ON "MenuCourse"("packageId");

-- CreateIndex
CREATE INDEX "MenuCourse_displayOrder_idx" ON "MenuCourse"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCourseOption_courseId_dishId_key" ON "MenuCourseOption"("courseId", "dishId");

-- CreateIndex
CREATE INDEX "MenuCourseOption_courseId_idx" ON "MenuCourseOption"("courseId");

-- CreateIndex
CREATE INDEX "MenuCourseOption_dishId_idx" ON "MenuCourseOption"("dishId");

-- AddForeignKey
ALTER TABLE "MenuCourse" ADD CONSTRAINT "MenuCourse_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCourseOption" ADD CONSTRAINT "MenuCourseOption_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MenuCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCourseOption" ADD CONSTRAINT "MenuCourseOption_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
