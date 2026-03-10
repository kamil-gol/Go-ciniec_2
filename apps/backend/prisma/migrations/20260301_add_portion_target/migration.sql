-- #166: Add portionTarget to PackageCategorySettings
-- Safe migration: ADD COLUMN with DEFAULT — no data loss, no table rewrite
-- Values: ALL (default) | ADULTS_ONLY | CHILDREN_ONLY

ALTER TABLE "PackageCategorySettings" ADD COLUMN "portionTarget" VARCHAR(20) NOT NULL DEFAULT 'ALL';
