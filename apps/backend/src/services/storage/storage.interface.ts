/**
 * Storage Service Interface
 * Abstrakcja nad systemem plików — umożliwia swap local ↔ MinIO
 * bez zmiany kodu w attachment.service, pdf.service itp.
 */

import { Readable } from 'stream';

export interface UploadResult {
  bucket: string;
  key: string;
  size: number;
}

export interface StorageStats {
  totalSize: number;
  fileCount: number;
}

export interface StorageObjectInfo {
  key: string;
  size: number;
  lastModified: Date;
}

export interface IStorageService {
  /** Upload pliku (Buffer lub Stream) do bucketu pod danym kluczem */
  upload(bucket: string, key: string, data: Buffer | Readable, metadata?: Record<string, string>): Promise<UploadResult>;

  /** Pobranie pliku jako Buffer */
  download(bucket: string, key: string): Promise<Buffer>;

  /** Pobranie pliku jako Readable stream (do pipe'owania do response) */
  getStream(bucket: string, key: string): Promise<Readable>;

  /** Usunięcie pliku */
  delete(bucket: string, key: string): Promise<void>;

  /** Sprawdzenie czy plik istnieje */
  exists(bucket: string, key: string): Promise<boolean>;

  /** Wygenerowanie tymczasowego URL do pobrania (MinIO presigned, local = API path) */
  getPresignedUrl(bucket: string, key: string, expirySeconds?: number): Promise<string>;

  /** Statystyki bucketu — łączny rozmiar i liczba plików */
  getStats(bucket: string): Promise<StorageStats>;

  /** Lista obiektów w buckecie z opcjonalnym prefixem */
  listObjects(bucket: string, prefix?: string): Promise<StorageObjectInfo[]>;

  /** Upewnij się że bucket istnieje (utwórz jeśli nie) */
  ensureBucket(bucket: string): Promise<void>;
}
