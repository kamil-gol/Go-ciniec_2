/**
 * Roles Service — CRUD for role management
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '@utils/AppError';
import { logActivity } from '@utils/audit-logger';
import { invalidateAllPermissionCaches } from '@middlewares/permissions';
import logger from '@utils/logger';

class RolesService {
  async getRoles() {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      isActive: role.isActive,
      usersCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        slug: rp.permission.slug,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });

    if (!role) throw AppError.notFound('Rola');

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      isActive: role.isActive,
      usersCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        slug: rp.permission.slug,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async createRole(data: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    permissionIds: string[];
  }, actorId: string) {
    // Check slug uniqueness
    const existing = await prisma.role.findUnique({ where: { slug: data.slug } });
    if (existing) throw AppError.conflict('Rola z tym slugiem już istnieje');

    const nameExists = await prisma.role.findUnique({ where: { name: data.name } });
    if (nameExists) throw AppError.conflict('Rola z tą nazwą już istnieje');

    // Verify all permission IDs exist
    const permsCount = await prisma.permission.count({
      where: { id: { in: data.permissionIds } },
    });
    if (permsCount !== data.permissionIds.length) {
      throw AppError.badRequest('Niektóre uprawnienia nie istnieją');
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        color: data.color,
        isSystem: false,
        permissions: {
          create: data.permissionIds.map((permId) => ({
            permissionId: permId,
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    await logActivity({
      userId: actorId,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role.id,
      details: { name: role.name, permissionsCount: data.permissionIds.length },
    });

    logger.info(`Role created: ${role.name} with ${data.permissionIds.length} permissions`);

    return this.formatRole(role);
  }

  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }, actorId: string) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Rola');

    // Check name uniqueness if changing
    if (data.name && data.name !== existing.name) {
      const nameTaken = await prisma.role.findUnique({ where: { name: data.name } });
      if (nameTaken) throw AppError.conflict('Rola z tą nazwą już istnieje');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    invalidateAllPermissionCaches();

    await logActivity({
      userId: actorId,
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: role.id,
      details: { changes: Object.keys(updateData) },
    });

    return this.formatRole(role);
  }

  async updateRolePermissions(id: string, permissionIds: string[], actorId: string) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw AppError.notFound('Rola');

    // Verify all permission IDs
    const permsCount = await prisma.permission.count({
      where: { id: { in: permissionIds } },
    });
    if (permsCount !== permissionIds.length) {
      throw AppError.badRequest('Niektóre uprawnienia nie istnieją');
    }

    // Delete existing and recreate (batch update)
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      ...permissionIds.map((permId) =>
        prisma.rolePermission.create({
          data: { roleId: id, permissionId: permId },
        })
      ),
    ]);

    invalidateAllPermissionCaches();

    const updated = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    await logActivity({
      userId: actorId,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'Role',
      entityId: id,
      details: { name: role.name, permissionsCount: permissionIds.length },
    });

    logger.info(`Role ${role.name} permissions updated: ${permissionIds.length} permissions`);

    return this.formatRole(updated!);
  }

  async deleteRole(id: string, actorId: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) throw AppError.notFound('Rola');

    if (role.isSystem) {
      throw AppError.badRequest('Nie można usunąć roli systemowej');
    }

    if (role._count.users > 0) {
      throw AppError.badRequest(
        `Nie można usunąć roli przypisanej do ${role._count.users} użytkowników. ` +
        'Najpierw zmień rolę tych użytkowników.'
      );
    }

    await prisma.role.delete({ where: { id } });

    invalidateAllPermissionCaches();

    await logActivity({
      userId: actorId,
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: id,
      details: { name: role.name },
    });

    logger.info(`Role deleted: ${role.name}`);
  }

  private formatRole(role: any) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      isActive: role.isActive,
      usersCount: role._count?.users || 0,
      permissions: (role.permissions || []).map((rp: any) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        slug: rp.permission.slug,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

export default new RolesService();
