#!/usr/bin/env tsx
/**
 * Skrypt migracji plików z lokalnego filesystem do MinIO.
 * 
 * Uruchomienie:
 *   cd /home/kamil/rezerwacje/apps/backend
 *   STORAGE_DRIVER=minio npx tsx src/scripts/migrate-to-minio.ts
 * 
 * Opcje env:
 *   DRY_RUN=true  — tylko raport, bez uploadu
 *   BATCH_SIZE=50 — ilość plików przetwarzanych jednocześnie
 * 
 * Skrypt:
 *   1. Czyta wszystkie Attachment z DB
 *   2. Dla każdego sprawdza czy plik istnieje w uploads/{storagePath}
 *   3. Uploaduje do MinIO bucket "attachments" z tym samym key
 *   4. Raportuje wynik
 */

import { prisma } from '@/lib/prisma';
import { MinioStorageService } from '../services/storage/minio.storage';
import { storageConfig } from '../config/storage.config';
import fs from 'fs';
import path from 'path';
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);

interface MigrationResult {
  total: number;
  migrated: number;
  skippedAlreadyExists: number;
  skippedMissingLocal: number;
  errors: { id: string; path: string; error: string }[];
}

async function migrate(): Promise<MigrationResult> {
  console.log('\n═══ Migracja plików do MinIO ═══');
  console.log(`  Endpoint: ${storageConfig.minio.endpoint}`);
  console.log(`  Bucket:   ${storageConfig.buckets.attachments}`);
  console.log(`  Dry run:  ${DRY_RUN}`);
  console.log(`  Batch:    ${BATCH_SIZE}`);
  console.log('');

  const minio = new MinioStorageService();
  const bucket = storageConfig.buckets.attachments;

  // Ensure bucket exists
  await minio.ensureBucket(bucket);

  // Load all attachments
  const attachments = await prisma.attachment.findMany({
    select: {
      id: true,
      storagePath: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const result: MigrationResult = {
    total: attachments.length,
    migrated: 0,
    skippedAlreadyExists: 0,
    skippedMissingLocal: 0,
    errors: [],
  };

  console.log(`Znaleziono ${attachments.length} załączników w DB\n`);

  // Process in batches
  for (let i = 0; i < attachments.length; i += BATCH_SIZE) {
    const batch = attachments.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (att) => {
      const localPath = path.join(UPLOAD_BASE, att.storagePath);
      const key = att.storagePath;

      // Check local file exists
      if (!fs.existsSync(localPath)) {
        result.skippedMissingLocal++;
        console.log(`  ❌ BRAK: ${att.storagePath} (${att.originalName})`);
        return;
      }

      // Check if already in MinIO
      const existsInMinio = await minio.exists(bucket, key);
      if (existsInMinio) {
        result.skippedAlreadyExists++;
        console.log(`  ⏭️ JUŻ: ${key}`);
        return;
      }

      // Upload
      if (DRY_RUN) {
        result.migrated++;
        console.log(`  📝 DRY: ${key} (${(att.sizeBytes / 1024).toFixed(1)} KB)`);
        return;
      }

      try {
        const buffer = fs.readFileSync(localPath);
        await minio.upload(bucket, key, buffer, {
          'Content-Type': att.mimeType,
          'X-Original-Name': encodeURIComponent(att.originalName),
        });
        result.migrated++;
        console.log(`  ✅ OK: ${key} (${(att.sizeBytes / 1024).toFixed(1)} KB)`);
      } catch (error: any) {
        result.errors.push({ id: att.id, path: att.storagePath, error: error.message });
        console.log(`  💥 FAIL: ${key} — ${error.message}`);
      }
    }));

    console.log(`  --- batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(attachments.length / BATCH_SIZE)} ---`);
  }

  return result;
}

async function main() {
  try {
    const result = await migrate();

    console.log('\n═══ WYNIK ═══');
    console.log(`  Razem w DB:        ${result.total}`);
    console.log(`  Zmigowano:         ${result.migrated}`);
    console.log(`  Już w MinIO:       ${result.skippedAlreadyExists}`);
    console.log(`  Brak na dysku:     ${result.skippedMissingLocal}`);
    console.log(`  Błędy:             ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n  Błędy:');
      result.errors.forEach(e => {
        console.log(`    - ${e.path}: ${e.error}`);
      });
    }

    if (DRY_RUN) {
      console.log('\n  📝 To był dry run. Uruchom bez DRY_RUN=true aby zmigować.');
    }

    console.log('');
  } catch (error) {
    console.error('\nMigracja nie powiodła się:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
