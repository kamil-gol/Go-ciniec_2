-- Add new fields to Hall table
ALTER TABLE "Hall" ADD COLUMN "pricePerChild" DECIMAL(10,2);

-- Add new fields to Reservation table
ALTER TABLE "Reservation" ADD COLUMN "adults" SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "children" SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "pricePerAdult" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "pricePerChild" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "confirmationDeadline" TIMESTAMP;

-- Add index for confirmationDeadline
CREATE INDEX "Reservation_confirmationDeadline_idx" ON "Reservation"("confirmationDeadline");

-- Migrate existing data: set adults = guests, children = 0
UPDATE "Reservation" SET "adults" = "guests" WHERE "adults" = 0;

-- Migrate existing data: set pricePerAdult from Hall's pricePerPerson
UPDATE "Reservation" r
SET "pricePerAdult" = h."pricePerPerson"
FROM "Hall" h
WHERE r."hallId" = h.id AND r."pricePerAdult" = 0;

-- Comment on new columns
COMMENT ON COLUMN "Hall"."pricePerChild" IS 'Optional separate price per child (if NULL, use pricePerPerson)';
COMMENT ON COLUMN "Reservation"."adults" IS 'Number of adult guests';
COMMENT ON COLUMN "Reservation"."children" IS 'Number of child guests';
COMMENT ON COLUMN "Reservation"."pricePerAdult" IS 'Price per adult for this reservation';
COMMENT ON COLUMN "Reservation"."pricePerChild" IS 'Price per child for this reservation';
COMMENT ON COLUMN "Reservation"."confirmationDeadline" IS 'Deadline to confirm PENDING reservation (max 1 day before event)';
