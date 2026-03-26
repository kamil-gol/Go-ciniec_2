/**
 * Unit tests for auth/token.service.ts
 * Covers: parseDuration, generateAccessToken, generateRefreshToken,
 *         revokeRefreshToken, revokeAllUserTokens, cleanupExpiredTokens
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    refreshToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

import { tokenService, parseDuration } from '../../../../services/auth/token.service';
import { prisma } from '../../../../lib/prisma';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// parseDuration
// ===============================================================

describe('parseDuration', () => {
  it('parses seconds', () => {
    expect(parseDuration('30s')).toBe(30 * 1000);
  });

  it('parses minutes', () => {
    expect(parseDuration('15m')).toBe(15 * 60 * 1000);
  });

  it('parses hours', () => {
    expect(parseDuration('24h')).toBe(24 * 60 * 60 * 1000);
  });

  it('parses days', () => {
    expect(parseDuration('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns 24h default for invalid format', () => {
    expect(parseDuration('invalid')).toBe(24 * 60 * 60 * 1000);
  });

  it('returns 24h default for empty string', () => {
    expect(parseDuration('')).toBe(24 * 60 * 60 * 1000);
  });
});

// ===============================================================
// generateAccessToken
// ===============================================================

describe('generateAccessToken', () => {
  it('returns a JWT string', () => {
    const token = tokenService.generateAccessToken({
      id: 'u1',
      email: 'test@test.pl',
      role: 'ADMIN',
    });

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('encodes payload in token', () => {
    const token = tokenService.generateAccessToken({
      id: 'u1',
      email: 'test@test.pl',
      role: 'ADMIN',
    });

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(payload.id).toBe('u1');
    expect(payload.email).toBe('test@test.pl');
    expect(payload.role).toBe('ADMIN');
  });
});

// ===============================================================
// generateRefreshToken
// ===============================================================

describe('generateRefreshToken', () => {
  it('creates token in DB and returns hex string', async () => {
    db.refreshToken.create.mockResolvedValue({});

    const token = await tokenService.generateRefreshToken('u1');

    expect(typeof token).toBe('string');
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        token: expect.any(String),
        userId: 'u1',
        expiresAt: expect.any(Date),
      }),
    });
  });
});

// ===============================================================
// revokeRefreshToken
// ===============================================================

describe('revokeRefreshToken', () => {
  it('sets revokedAt on matching token', async () => {
    db.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await tokenService.revokeRefreshToken('abc123');

    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { token: 'abc123', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

// ===============================================================
// revokeAllUserTokens
// ===============================================================

describe('revokeAllUserTokens', () => {
  it('revokes all non-revoked tokens for user', async () => {
    db.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    await tokenService.revokeAllUserTokens('u1');

    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

// ===============================================================
// cleanupExpiredTokens
// ===============================================================

describe('cleanupExpiredTokens', () => {
  it('deletes expired and revoked tokens', async () => {
    db.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

    const count = await tokenService.cleanupExpiredTokens();

    expect(count).toBe(5);
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { revokedAt: { not: null } },
        ],
      },
    });
  });

  it('returns 0 when nothing to clean', async () => {
    db.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const count = await tokenService.cleanupExpiredTokens();
    expect(count).toBe(0);
  });
});
