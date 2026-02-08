/*
  Warnings:

  - You are about to drop the column `paidDate` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `depositDueDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `depositPaid` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `changedBy` on the `ReservationHistory` table. All the data in the column will be lost.
  - Changed the type of `dueDate` on the `Deposit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `EventType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `date` on the `Reservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `startTime` on the `Reservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `Reservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `changedByUserId` to the `ReservationHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "ReservationHistory" DROP CONSTRAINT "ReservationHistory_changedBy_fkey";

-- DropIndex
DROP INDEX "Deposit_reservationId_key";

-- DropIndex
DROP INDEX "Reservation_createdBy_idx";

-- DropIndex
DROP INDEX "ReservationHistory_changedBy_idx";

-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "paidDate",
ADD COLUMN     "paidAt" TIMESTAMP(3),
DROP COLUMN "dueDate",
ADD COLUMN     "dueDate" VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "color" VARCHAR(20),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Hall" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "createdBy",
DROP COLUMN "depositAmount",
DROP COLUMN "depositDueDate",
DROP COLUMN "depositPaid",
ADD COLUMN     "createdById" UUID NOT NULL,
DROP COLUMN "date",
ADD COLUMN     "date" VARCHAR(10) NOT NULL,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" VARCHAR(5) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" VARCHAR(5) NOT NULL;

-- AlterTable
ALTER TABLE "ReservationHistory" DROP COLUMN "changedBy",
ADD COLUMN     "changedByUserId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Deposit_reservationId_idx" ON "Deposit"("reservationId");

-- CreateIndex
CREATE INDEX "Deposit_dueDate_idx" ON "Deposit"("dueDate");

-- CreateIndex
CREATE INDEX "EventType_isActive_idx" ON "EventType"("isActive");

-- CreateIndex
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");

-- CreateIndex
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");

-- CreateIndex
CREATE INDEX "ReservationHistory_changedByUserId_idx" ON "ReservationHistory"("changedByUserId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationHistory" ADD CONSTRAINT "ReservationHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
