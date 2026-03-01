/**
 * Image Compression Utility
 * Kompresja obrazów przy uploadzie używając sharp.
 * Obsługuje: JPEG, PNG, WebP
 * Pomija: PDF, DOCX, XLSX i inne nie-obrazy
 *
 * Parametry:
 *   - maxDimension: 2000px (najdłuższy bok)
 *   - quality: 80%
 *   - Nie powiększa małych obrazów (withoutEnlargement)
 */

import sharp from 'sharp';
import logger from './logger';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type ImageMimeType = typeof IMAGE_MIME_TYPES[number];

const COMPRESSION_CONFIG = {
  maxDimension: 2000,
  quality: 80,
} as const;

export interface CompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  width?: number;
  height?: number;
  format?: string;
}

function isImageMime(mimeType: string): mimeType is ImageMimeType {
  return IMAGE_MIME_TYPES.includes(mimeType as ImageMimeType);
}

/**
 * Kompresuj obraz jeśli to obsługiwany format.
 * Zwraca oryginalny buffer bez zmian dla nie-obrazów.
 */
export async function compressIfImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<CompressionResult> {
  if (!isImageMime(mimeType)) {
    return {
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      wasCompressed: false,
    };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const needsResize =
      (metadata.width && metadata.width > COMPRESSION_CONFIG.maxDimension) ||
      (metadata.height && metadata.height > COMPRESSION_CONFIG.maxDimension);

    let pipeline = image.rotate();

    if (needsResize) {
      pipeline = pipeline.resize({
        width: COMPRESSION_CONFIG.maxDimension,
        height: COMPRESSION_CONFIG.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    switch (mimeType) {
      case 'image/jpeg':
        pipeline = pipeline.jpeg({ quality: COMPRESSION_CONFIG.quality, mozjpeg: true });
        break;
      case 'image/png':
        pipeline = pipeline.png({ quality: COMPRESSION_CONFIG.quality, compressionLevel: 8 });
        break;
      case 'image/webp':
        pipeline = pipeline.webp({ quality: COMPRESSION_CONFIG.quality });
        break;
    }

    const compressedBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(compressedBuffer).metadata();

    const ratio = ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1);
    logger.info(
      `[ImageCompression] ${originalName}: ${formatBytes(buffer.length)} → ${formatBytes(compressedBuffer.length)} ` +
      `(-${ratio}%) | ${metadata.width}x${metadata.height} → ${outputMetadata.width}x${outputMetadata.height}`
    );

    return {
      buffer: compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      wasCompressed: true,
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: outputMetadata.format,
    };
  } catch (error) {
    logger.warn(`[ImageCompression] Nie udało się skompresować ${originalName}, używam oryginału:`, error);
    return {
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      wasCompressed: false,
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
