/**
 * Users Service — CRUD for user management in Settings
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@utils/password';
import { AppError } from '@utils/AppError';
import { logChange } from '@utils/audit-logger';
import { invalidatePermissionCache } from '@middlewares/permissions';
import logger from '@utils/logger';

interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class UsersService {
  async getUsers(params: UsersQueryParams) {
    const {
      page = 1,
      limit = 20,
      search,
      roleId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          assignedRole: {
            select: { id: true, name: true, slug: true, color: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        role: u.assignedRole,
        legacyRole: u.legacyRole,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) throw AppError.notFound('Użytkownik');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      role: user.assignedRole
        ? {
            id: user.assignedRole.id,
            name: user.assignedRole.name,
            slug: user.assignedRole.slug,
            color: user.assignedRole.color,
          }
        : null,
      permissions: user.assignedRole
        ? user.assignedRole.permissions.map((rp) => rp.permission.slug)
        : [],
      legacyRole: user.legacyRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }, actorId: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Użytkownik z tym adresem email już istnieje');

    validatePassword(data.password);

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) throw AppError.notFound('Rola');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        legacyRole: role.slug === 'admin' ? 'ADMIN' : 'EMPLOYEE',
      },
      include: {
        assignedRole: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
    });

    await logChange({
      userId: actorId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: role.name },
    });

    logger.info(`User created: ${user.email} with role ${role.name}`);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      role: user.assignedRole,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    isActive?: boolean;
  }, actorId: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Użytkownik');

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailTaken) throw AppError.conflict('Ten adres email jest już zajęty');
    }

    if (data.roleId) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role) throw AppError.notFound('Rola');
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        assignedRole: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
    });

    if (data.roleId) {
      invalidatePermissionCache(id);
    }

    await logChange({
      userId: actorId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      details: { changes: Object.keys(updateData) },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      role: user.assignedRole,
      updatedAt: user.updatedAt,
    };
  }

  async changePassword(id: string, newPassword: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('Użytkownik');

    validatePassword(newPassword);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await logChange({
      userId: actorId,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: id,
      details: { changedBy: actorId === id ? 'self' : 'admin' },
    });

    logger.info(`Password changed for user ${user.email}`);
  }

  async toggleActive(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('Użytkownik');

    if (id === actorId) {
      throw AppError.badRequest('Nie możesz dezaktywować własnego konta');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: {
        assignedRole: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
    });

    await logChange({
      userId: actorId,
      action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: id,
      details: { email: user.email },
    });

    return {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
      role: updated.assignedRole,
    };
  }

  async deleteUser(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('Użytkownik');

    if (id === actorId) {
      throw AppError.badRequest('Nie możesz usunąć własnego konta');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    invalidatePermissionCache(id);

    await logChange({
      userId: actorId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      details: { email: user.email },
    });

    logger.info(`User soft-deleted: ${user.email}`);
  }
}

export default new UsersService();
