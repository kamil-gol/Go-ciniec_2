/**
 * Token Service — JWT access tokens, opaque refresh tokens, revocation
 * Extracted from auth.service.ts for #145 refresh token rotation
 */
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import logger from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '24h';

/**
 * Parse duration string (e.g. '15m', '24h', '7d') to milliseconds.
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 24 * 60 * 60 * 1000;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

class TokenService {
  /**
   * Generate short-lived JWT access token (default: 15m).
   */
  generateAccessToken(payload: { id: string; email: string; role: string }): string {
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, JWT_SECRET, signOptions);
  }

  /**
   * Generate opaque refresh token (64-char hex), stored in DB.
   * Default TTL: 24h (configurable via REFRESH_TOKEN_EXPIRES_IN).
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN));

    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  /**
   * Revoke a specific refresh token (set revokedAt).
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke ALL refresh tokens for a user (e.g. after password change).
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.info(`[Auth] All refresh tokens revoked for user ${userId}`);
  }

  /**
   * Cleanup expired and revoked refresh tokens from DB.
   * Should be called periodically (CRON) to prevent table bloat.
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
    logger.info(`[Auth] Cleaned up ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }
}

export const tokenService = new TokenService();
