-- AlterEnum: Add ARCHIVED status to ReservationStatus
-- Issue: #144 — Auto-archiwizacja anulowanych rezerwacji
-- Description: Adds ARCHIVED value to the ReservationStatus enum.
-- CANCELLED reservations older than ARCHIVE_AFTER_DAYS will be auto-archived by CRON.

ALTER TYPE "ReservationStatus" ADD VALUE 'ARCHIVED';
