-- Add extraHoursCost field to Reservation for backend-computed extra hours pricing
-- Previously extra hours were only calculated on the frontend, causing list vs detail mismatch
ALTER TABLE "Reservation" ADD COLUMN "extraHoursCost" DECIMAL(10,2) NOT NULL DEFAULT 0;
