-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- AlterTable: add clientType + company fields to Client
ALTER TABLE "Client" ADD COLUMN "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Client" ADD COLUMN "companyName" VARCHAR(255);
ALTER TABLE "Client" ADD COLUMN "nip" VARCHAR(20);
ALTER TABLE "Client" ADD COLUMN "regon" VARCHAR(20);
ALTER TABLE "Client" ADD COLUMN "companyEmail" VARCHAR(255);
ALTER TABLE "Client" ADD COLUMN "companyPhone" VARCHAR(20);
ALTER TABLE "Client" ADD COLUMN "companyAddress" TEXT;
ALTER TABLE "Client" ADD COLUMN "companyCity" VARCHAR(100);
ALTER TABLE "Client" ADD COLUMN "companyPostalCode" VARCHAR(10);
ALTER TABLE "Client" ADD COLUMN "industry" VARCHAR(100);
ALTER TABLE "Client" ADD COLUMN "website" VARCHAR(255);

-- CreateTable: ClientContact (contact persons for company clients)
CREATE TABLE "ClientContact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "role" VARCHAR(100),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Client company indexes
CREATE INDEX "Client_clientType_idx" ON "Client"("clientType");
CREATE INDEX "Client_nip_idx" ON "Client"("nip");
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");

-- CreateIndex: ClientContact indexes
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");
CREATE INDEX "ClientContact_isPrimary_idx" ON "ClientContact"("isPrimary");

-- AddForeignKey: ClientContact → Client (cascade delete)
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
