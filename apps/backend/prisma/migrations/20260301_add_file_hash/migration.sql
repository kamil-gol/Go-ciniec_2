-- #146: Add fileHash column to Attachment for SHA-256 deduplication

ALTER TABLE "Attachment" ADD COLUMN "fileHash" VARCHAR(64);

CREATE INDEX "Attachment_fileHash_idx" ON "Attachment"("fileHash");
