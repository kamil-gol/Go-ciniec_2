-- Migration: 20260312_catering_section_decimal_select
-- Zmiana minSelect i maxSelect w CateringPackageSection z SmallInt na Decimal(4,2)
-- Umożliwia wartości ćwiartkowe: 0.25, 0.50, 0.75, 1.00 itd.

ALTER TABLE "CateringPackageSection"
  ALTER COLUMN "minSelect" TYPE DECIMAL(4,2) USING "minSelect"::DECIMAL(4,2),
  ALTER COLUMN "maxSelect" TYPE DECIMAL(4,2) USING "maxSelect"::DECIMAL(4,2);
