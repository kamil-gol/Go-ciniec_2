/**
 * Auth Service — login, register, token management, password reset
 * Token logic extracted to auth/token.service.ts
 * Password reset/change extracted to auth/password-reset.service.ts
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logChange } from '@utils/audit-logger';
import { AUTH, REFRESH_TOKEN as REFRESH_TOKEN_MSG } from '../i18n/pl';
import { AppError } from '../utils/AppError';
import logger from '@utils/logger';
import { tokenService } from './auth/token.service';
import { passwordResetService } from './auth/password-reset.service';

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
  // ===============================================
  // REGISTER & LOGIN
  // ===============================================

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

    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: 'user',
    });

    const refreshToken = await tokenService.generateRefreshToken(user.id);

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

    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role,
    });

    const refreshToken = await tokenService.generateRefreshToken(user.id);

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

  // ===============================================
  // REFRESH & LOGOUT (#145)
  // ===============================================

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
      await tokenService.revokeAllUserTokens(tokenRecord.userId);
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
    await tokenService.revokeRefreshToken(refreshTokenStr);

    const user = tokenRecord.user;
    const role = user.assignedRole?.slug || user.legacyRole || 'user';

    const newAccessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role,
    });

    const newRefreshToken = await tokenService.generateRefreshToken(user.id);

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
    await tokenService.revokeRefreshToken(refreshTokenStr);
    logger.info('[Auth] User logged out, refresh token revoked');
  }

  // ===============================================
  // GET ME
  // ===============================================

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

  // ===============================================
  // PASSWORD RESET & CHANGE — delegated
  // ===============================================

  async forgotPassword(email: string): Promise<void> {
    return passwordResetService.forgotPassword(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return passwordResetService.resetPassword(token, newPassword);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    return passwordResetService.changePassword(userId, oldPassword, newPassword);
  }

  // ===============================================
  // TOKEN CLEANUP — delegated
  // ===============================================

  async cleanupExpiredTokens(): Promise<number> {
    return tokenService.cleanupExpiredTokens();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    return tokenService.revokeAllUserTokens(userId);
  }
}

export default new AuthService();
