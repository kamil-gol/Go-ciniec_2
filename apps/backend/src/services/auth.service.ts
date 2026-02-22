/**
 * Auth Service — login, register, token management, password reset
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { logChange } from '@utils/audit-logger';
import { AUTH, PASSWORD_RESET } from '../i18n/pl';
import { validatePassword } from '../utils/password';
import { AppError } from '../utils/AppError';
import emailService from './email.service';
import logger from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    legacyRole: string;
    role: { id: string; name: string; slug: string; color: string | null } | null;
    permissions: string[];
  };
}

class AuthService {
  private generateToken(payload: { id: string; email: string; role: string }): string {
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, JWT_SECRET, signOptions);
  }

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

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: 'user',
    });

    await logChange({
      userId: user.id,
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Nowy użytkownik zarejestrowany: ${user.email}` },
    });

    logger.info(`User registered: ${user.email}`);

    return {
      token,
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

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.assignedRole?.slug || user.legacyRole || 'user',
    });

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
      token,
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
