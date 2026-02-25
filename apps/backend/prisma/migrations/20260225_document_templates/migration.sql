-- DocumentTemplate — system edytowalnych szablonów dokumentów (#151)
-- Bezpieczna migracja — nowe tabele, nie modyfikuje istniejących danych

-- ═══ DocumentTemplate ═══
CREATE TABLE "DocumentTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "availableVars" TEXT[],
    "version" SMALLINT NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- ═══ DocumentTemplateHistory ═══
CREATE TABLE "DocumentTemplateHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "version" SMALLINT NOT NULL,
    "changedById" UUID NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTemplateHistory_pkey" PRIMARY KEY ("id")
);

-- ═══ Unique constraints ═══
CREATE UNIQUE INDEX "DocumentTemplate_slug_key" ON "DocumentTemplate"("slug");

-- ═══ Indexes: DocumentTemplate ═══
CREATE INDEX "DocumentTemplate_slug_idx" ON "DocumentTemplate"("slug");
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");
CREATE INDEX "DocumentTemplate_isActive_idx" ON "DocumentTemplate"("isActive");
CREATE INDEX "DocumentTemplate_displayOrder_idx" ON "DocumentTemplate"("displayOrder");

-- ═══ Indexes: DocumentTemplateHistory ═══
CREATE INDEX "DocumentTemplateHistory_templateId_idx" ON "DocumentTemplateHistory"("templateId");
CREATE INDEX "DocumentTemplateHistory_changedById_idx" ON "DocumentTemplateHistory"("changedById");
CREATE INDEX "DocumentTemplateHistory_version_idx" ON "DocumentTemplateHistory"("version");

-- ═══ Foreign keys ═══
ALTER TABLE "DocumentTemplateHistory" ADD CONSTRAINT "DocumentTemplateHistory_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentTemplateHistory" ADD CONSTRAINT "DocumentTemplateHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
