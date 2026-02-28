-- #165: Add allowMultipleBookings to Hall model
-- Default TRUE preserves existing behavior (single booking per hall, but now capacity-aware)
-- Set to FALSE for halls that should NOT allow multiple concurrent reservations

ALTER TABLE "Hall" ADD COLUMN "allowMultipleBookings" BOOLEAN NOT NULL DEFAULT true;
