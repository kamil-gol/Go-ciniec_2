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
import { validatePassword } from '@utils/password';
import emailService from './email.service';
import logger from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PASSWORD_RESET_EXPIRY_HOURS = 1;

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
  private generateToken(payload: { userId: string; email: string; role: string }): string {
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
      userId: user.id,
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
      userId: user.id,
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

  // ═══════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════

  /**
   * Forgot password — generate reset token and send email.
   * Always returns success to prevent user enumeration.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return same message — prevent email enumeration
    if (!user || !user.isActive) {
      logger.info(`[Auth] Password reset requested for non-existent/inactive email: ${email}`);
      return { message: PASSWORD_RESET.EMAIL_SENT };
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // mark as used so they can't be reused
      },
    });

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    // Store hashed token in DB
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(user.email, {
      userName: `${user.firstName} ${user.lastName}`,
      resetUrl,
      expiryHours: PASSWORD_RESET_EXPIRY_HOURS,
    });

    // Audit log
    await logChange({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Żądanie resetu hasła dla: ${user.email}` },
    });

    logger.info(`[Auth] Password reset email sent to: ${user.email}`);

    return { message: PASSWORD_RESET.EMAIL_SENT };
  }

  /**
   * Reset password using token from email link.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // Hash the incoming token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      throw new Error(PASSWORD_RESET.TOKEN_INVALID);
    }

    if (resetToken.usedAt) {
      throw new Error(PASSWORD_RESET.TOKEN_USED);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error(PASSWORD_RESET.TOKEN_EXPIRED);
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Audit log
    await logChange({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: resetToken.userId,
      details: { description: `Hasło zresetowane dla: ${resetToken.user.email}` },
    });

    logger.info(`[Auth] Password reset completed for: ${resetToken.user.email}`);

    return { message: PASSWORD_RESET.PASSWORD_CHANGED };
  }

  /**
   * Change password from dashboard (requires old password).
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(AUTH.USER_NOT_FOUND);
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error(PASSWORD_RESET.OLD_PASSWORD_WRONG);
    }

    // Check new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error(PASSWORD_RESET.SAME_PASSWORD);
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Audit log
    await logChange({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      details: { description: `Użytkownik zmienił hasło: ${user.email}` },
    });

    logger.info(`[Auth] Password changed by user: ${user.email}`);

    return { message: PASSWORD_RESET.PASSWORD_UPDATED };
  }
}

export default new AuthService();
