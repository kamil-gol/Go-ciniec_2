/**
 * Auth Service — login, register, token management
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { logChange } from '@utils/audit-logger';
import { AUTH } from '../i18n/pl';
import logger from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
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
}

export default new AuthService();
