-- AlterEnum: Add ARCHIVED to ReservationStatus
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
