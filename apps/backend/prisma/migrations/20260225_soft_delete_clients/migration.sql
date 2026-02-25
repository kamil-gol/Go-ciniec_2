-- Soft-delete klientów: isDeleted + deletedAt
-- Bezpieczna migracja — tylko ADD COLUMN, nie modyfikuje istniejących danych

ALTER TABLE "Client" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indeks dla szybkiego filtrowania aktywnych klientów
CREATE INDEX "Client_isDeleted_idx" ON "Client"("isDeleted");
