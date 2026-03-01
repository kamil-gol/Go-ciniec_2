/**
 * File Hash Utility
 * SHA-256 hashing for file deduplication.
 * Uses Node.js built-in crypto module (zero dependencies).
 */

import crypto from 'crypto';

/**
 * Compute SHA-256 hash of a buffer.
 * Returns lowercase hex string (64 chars).
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
