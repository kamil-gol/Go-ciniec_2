-- Phase 4: Add archiveAfterDays to CompanySettings
-- Allows admin to configure auto-archive delay from the panel

ALTER TABLE "CompanySettings" ADD COLUMN "archiveAfterDays" SMALLINT NOT NULL DEFAULT 30;
