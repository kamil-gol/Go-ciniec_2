import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@utils/password';
import { generateToken } from '@middlewares/auth';
import logger from '@utils/logger';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
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
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Build permission list
    const permissions = user.assignedRole
      ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
      : [];

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: (user.legacyRole as any) || 'EMPLOYEE',
      roleId: user.roleId || undefined,
      roleSlug: user.assignedRole?.slug || undefined,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    logger.info(`User logged in: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.legacyRole || 'EMPLOYEE',
        assignedRole: user.assignedRole
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
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    validatePassword(data.password);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // If no roleId provided, find the default employee role
    let roleId = data.roleId;
    if (!roleId) {
      const employeeRole = await prisma.role.findUnique({ where: { slug: 'employee' } });
      roleId = employeeRole?.id;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        legacyRole: 'EMPLOYEE',
        roleId: roleId || undefined,
      },
      include: {
        assignedRole: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'EMPLOYEE',
      roleId: user.roleId || undefined,
      roleSlug: user.assignedRole?.slug || undefined,
    });

    logger.info(`New user registered: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.legacyRole || 'EMPLOYEE',
        assignedRole: user.assignedRole
          ? {
              id: user.assignedRole.id,
              name: user.assignedRole.name,
              slug: user.assignedRole.slug,
              color: user.assignedRole.color,
            }
          : null,
      },
    };
  },

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
      throw new Error('User not found');
    }

    const permissions = user.assignedRole
      ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
      : [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.legacyRole || 'EMPLOYEE',
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      assignedRole: user.assignedRole
        ? {
            id: user.assignedRole.id,
            name: user.assignedRole.name,
            slug: user.assignedRole.slug,
            color: user.assignedRole.color,
          }
        : null,
      permissions,
    };
  },
};
