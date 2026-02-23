/**
 * Auth Service — login, register, token management, password reset
 * 🔄 #145: Refresh token rotation, access token 15min, session management
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { logChange } from '@utils/audit-logger';
import { AUTH, PASSWORD_RESET, REFRESH_TOKEN as REFRESH_TOKEN_MSG } from '../i18n/pl';
import { validatePassword } from '../utils/password';
import { AppError } from '../utils/AppError';
import emailService from './email.service';
import logger from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '24h';

/**
 * Parse duration string (e.g. '15m', '24h', '7d') to milliseconds.
 */
function parseDuration(duration: string): number {
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

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  legacyRole: string;
  role: { id: string; name: string; slug: string; color: string | null } | null;
  permissions: string[];
}

interface LoginResult {
  token: string;
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

class AuthService {
  // ═══════════════════════════════════════════════
  // 🔑 TOKEN GENERATION
  // ═══════════════════════════════════════════════

  /**
   * Generate short-lived JWT access token (default: 15m).
   */
  private generateAccessToken(payload: { id: string; email: string; role: string }): string {
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, JWT_SECRET, signOptions);
  }

  /**
   * Generate opaque refresh token (64-char hex), stored in DB.
   * Default TTL: 24h (configurable via REFRESH_TOKEN_EXPIRES_IN).
   */
  private async generateRefreshToken(userId: string): Promise<string> {
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
  private async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ═══════════════════════════════════════════════
  // 🔐 REGISTER & LOGIN
  // ═══════════════════════════════════════════════

  async register(input: RegisterInput): Promise<LoginResult> {
    const { email, password, firstName, lastName } = input;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new Error('Użytkownik z tym adresem email już istnieje');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: 'user',
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    await logChange({
      userId: user.id,
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Nowy użytkownik zarejestrowany: ${user.email}` },
    });

    logger.info(`User registered: ${user.email}`);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        legacyRole: 'user',
        role: null,
        permissions: [],
      },
    };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        assignedRole: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(AUTH.INVALID_CREDENTIALS);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error(AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new Error(AUTH.USER_INACTIVE);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const role = user.assignedRole?.slug || user.legacyRole || 'user';

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role,
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    const permissions = user.assignedRole
      ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
      : [];

    // Audit log
    await logChange({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Użytkownik zalogował się: ${user.email}` },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        legacyRole: user.legacyRole || 'user',
        role: user.assignedRole
          ? {
              id: user.assignedRole.id,
              name: user.assignedRole.name,
              slug: user.assignedRole.slug,
              color: user.assignedRole.color,
            }
          : null,
        permissions,
      },
    };
  }

  // ═══════════════════════════════════════════════
  // 🔄 REFRESH & LOGOUT (#145)
  // ═══════════════════════════════════════════════

  /**
   * Refresh access token using a valid refresh token.
   * Implements rotation: old refresh token is revoked, new pair is issued.
   * Reuse detection: if revoked token is used again, ALL user tokens are revoked.
   */
  async refresh(refreshTokenStr: string): Promise<RefreshResult> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: {
        user: {
          include: {
            assignedRole: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      throw AppError.unauthorized(REFRESH_TOKEN_MSG.INVALID);
    }

    if (tokenRecord.revokedAt) {
      // Potential token reuse detected — revoke ALL user tokens for safety
      await this.revokeAllUserTokens(tokenRecord.userId);
      logger.warn(`[Auth] Refresh token reuse detected for user ${tokenRecord.userId}`);
      throw AppError.unauthorized(REFRESH_TOKEN_MSG.REVOKED);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw AppError.unauthorized(REFRESH_TOKEN_MSG.EXPIRED);
    }

    if (!tokenRecord.user.isActive) {
      throw AppError.unauthorized(AUTH.USER_INACTIVE);
    }

    // Rotate: revoke old, create new pair
    await this.revokeRefreshToken(refreshTokenStr);

    const user = tokenRecord.user;
    const role = user.assignedRole?.slug || user.legacyRole || 'user';

    const newAccessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role,
    });

    const newRefreshToken = await this.generateRefreshToken(user.id);

    const permissions = user.assignedRole
      ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
      : [];

    logger.debug(`[Auth] Token refreshed for: ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        legacyRole: user.legacyRole || 'user',
        role: user.assignedRole
          ? {
              id: user.assignedRole.id,
              name: user.assignedRole.name,
              slug: user.assignedRole.slug,
              color: user.assignedRole.color,
            }
          : null,
        permissions,
      },
    };
  }

  /**
   * Logout — revoke specific refresh token.
   */
  async logout(refreshTokenStr: string): Promise<void> {
    await this.revokeRefreshToken(refreshTokenStr);
    logger.info('[Auth] User logged out, refresh token revoked');
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

  // ═══════════════════════════════════════════════
  // 👤 GET ME
  // ═══════════════════════════════════════════════

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedRole: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    const permissions = user.assignedRole
      ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
      : [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      legacyRole: user.legacyRole || 'user',
      role: user.assignedRole
        ? {
            id: user.assignedRole.id,
            name: user.assignedRole.name,
            slug: user.assignedRole.slug,
            color: user.assignedRole.color,
          }
        : null,
      permissions,
    };
  }

  // ═══════════════════════════════════════════════
  // 🔑 PASSWORD RESET & CHANGE
  // ═══════════════════════════════════════════════

  /**
   * Request password reset — generates token & sends email.
   * Always returns void (never reveals if email exists).
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Anti-enumeration: always succeed silently
    if (!user || !user.isActive) {
      logger.info(`[Auth] Password reset requested for unknown/inactive email: ${email}`);
      return;
    }

    // Generate secure 64-char hex token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create new token in DB
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send email (fire-and-forget — don't block response)
    emailService.sendPasswordResetEmail(user.email, {
      firstName: user.firstName,
      resetUrl,
      expiresInMinutes: 60,
    }).catch((err) => {
      logger.error(`[Auth] Failed to send password reset email to ${user.email}: ${err.message}`);
    });

    await logChange({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Żądanie resetowania hasła dla: ${user.email}` },
    });

    logger.info(`[Auth] Password reset token generated for: ${user.email}`);
  }

  /**
   * Reset password using a valid token from email link.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw AppError.badRequest(PASSWORD_RESET.TOKEN_INVALID);
    }

    if (resetToken.usedAt) {
      throw AppError.badRequest(PASSWORD_RESET.TOKEN_USED);
    }

    if (resetToken.expiresAt < new Date()) {
      throw AppError.badRequest(PASSWORD_RESET.TOKEN_EXPIRED);
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw AppError.badRequest(validation.errors.join('. '));
    }

    // Hash and update in a transaction
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Security: revoke all refresh tokens after password reset
    await this.revokeAllUserTokens(resetToken.userId);

    await logChange({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: resetToken.userId,
      details: { description: `Hasło zresetowane przez link email dla: ${resetToken.user.email}` },
    });

    logger.info(`[Auth] Password reset completed for: ${resetToken.user.email}`);
  }

  /**
   * Change password for authenticated user (requires old password).
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('Użytkownik');
    }

    // Verify old password
    const isValidOld = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOld) {
      throw AppError.badRequest(PASSWORD_RESET.OLD_PASSWORD_WRONG);
    }

    // Prevent reuse of same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw AppError.badRequest(PASSWORD_RESET.SAME_PASSWORD);
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw AppError.badRequest(validation.errors.join('. '));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Security: revoke all refresh tokens after password change — forces re-login
    await this.revokeAllUserTokens(userId);

    await logChange({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Użytkownik zmienił hasło: ${user.email}` },
    });

    logger.info(`[Auth] Password changed by user: ${user.email}`);
  }
}

export default new AuthService();
