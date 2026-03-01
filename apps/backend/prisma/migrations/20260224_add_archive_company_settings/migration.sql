-- Phase 4: CompanySettings table + archiveAfterDays
-- The baseline migration was missing this table.
-- CREATE IF NOT EXISTS to be safe on existing databases.

CREATE TABLE IF NOT EXISTS "CompanySettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyName" VARCHAR(255) NOT NULL,
    "nip" VARCHAR(20),
    "regon" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "postalCode" VARCHAR(10),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "logoUrl" TEXT,
    "defaultCurrency" VARCHAR(3) NOT NULL DEFAULT 'PLN',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Warsaw',
    "invoicePrefix" VARCHAR(20),
    "receiptPrefix" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- Add archiveAfterDays column (safe: only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'CompanySettings' AND column_name = 'archiveAfterDays'
    ) THEN
        ALTER TABLE "CompanySettings" ADD COLUMN "archiveAfterDays" SMALLINT NOT NULL DEFAULT 30;
    END IF;
END $$;
