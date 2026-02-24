-- Etap 5: Notatka wewnętrzna
-- Pole widoczne tylko dla pracowników, NIE pojawia się w PDF

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "internalNotes" TEXT;
