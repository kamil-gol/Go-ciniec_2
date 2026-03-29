import { computeFileHash } from '../../../utils/file-hash';

describe('computeFileHash', () => {
  it('should return a 64-character hex string', () => {
    const buffer = Buffer.from('test content');
    const hash = computeFileHash(buffer);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return consistent hash for same content', () => {
    const buffer = Buffer.from('same content');
    expect(computeFileHash(buffer)).toBe(computeFileHash(buffer));
  });

  it('should return different hashes for different content', () => {
    const hash1 = computeFileHash(Buffer.from('content A'));
    const hash2 = computeFileHash(Buffer.from('content B'));
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty buffer', () => {
    const hash = computeFileHash(Buffer.alloc(0));
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle binary data', () => {
    const buffer = Buffer.from([0x00, 0xFF, 0x42, 0x89]);
    const hash = computeFileHash(buffer);
    expect(hash).toHaveLength(64);
  });
});
