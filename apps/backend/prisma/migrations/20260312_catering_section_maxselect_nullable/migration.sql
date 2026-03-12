-- CateringPackageSection.maxSelect: NOT NULL Decimal(4,2) -> nullable Decimal(4,2)
-- Istniejące rekordy z wartością domyślną 1 zostają zachowane bez zmian.
ALTER TABLE "CateringPackageSection" ALTER COLUMN "maxSelect" DROP NOT NULL;
