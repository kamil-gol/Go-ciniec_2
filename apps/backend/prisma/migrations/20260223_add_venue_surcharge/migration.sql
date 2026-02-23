-- AlterTable: Add venue surcharge fields to Reservation
-- #137: Whole venue surcharge for "Cały Obiekt" bookings
-- < 30 guests → 3000 PLN, >= 30 guests → 2000 PLN

ALTER TABLE "Reservation" ADD COLUMN "venueSurcharge" DECIMAL(10, 2);
ALTER TABLE "Reservation" ADD COLUMN "venueSurchargeLabel" VARCHAR(255);
