-- Schema sync migration: add tables and columns that exist in schema.prisma
-- but were never created via migration.

-- ═══ Hall: add allowWithWholeVenue ═══
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "allowWithWholeVenue" BOOLEAN NOT NULL DEFAULT false;

-- ═══ PasswordResetToken (entire table) ═══
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══ MenuCourse (replaces old MenuOption — entire table) ═══
CREATE TABLE IF NOT EXISTS "MenuCourse" (
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

CREATE INDEX IF NOT EXISTS "MenuCourse_packageId_idx" ON "MenuCourse"("packageId");
CREATE INDEX IF NOT EXISTS "MenuCourse_displayOrder_idx" ON "MenuCourse"("displayOrder");

ALTER TABLE "MenuCourse" ADD CONSTRAINT "MenuCourse_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══ MenuCourseOption (replaces old MenuPackageOption — entire table) ═══
CREATE TABLE IF NOT EXISTS "MenuCourseOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    "customPrice" DECIMAL(10, 2),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCourseOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MenuCourseOption_courseId_dishId_key" ON "MenuCourseOption"("courseId", "dishId");
CREATE INDEX IF NOT EXISTS "MenuCourseOption_courseId_idx" ON "MenuCourseOption"("courseId");
CREATE INDEX IF NOT EXISTS "MenuCourseOption_dishId_idx" ON "MenuCourseOption"("dishId");

ALTER TABLE "MenuCourseOption" ADD CONSTRAINT "MenuCourseOption_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "MenuCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuCourseOption" ADD CONSTRAINT "MenuCourseOption_dishId_fkey"
  FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
