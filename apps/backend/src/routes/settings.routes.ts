/**
 * Settings Routes
 *
 * Mounts all settings sub-modules under /api/settings:
 *   /api/settings/users          — User management
 *   /api/settings/roles          — Role management
 *   /api/settings/permissions    — Permission listing
 *   /api/settings/company        — Company settings
 *   /api/settings/archive        — Archive configuration & manual trigger (#144)
 */
import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth';
import { requirePermission } from '@middlewares/permissions';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validateBody } from '@middlewares/validateBody';
import usersController from '@controllers/users.controller';
import rolesController from '@controllers/roles.controller';
import permissionsController from '@controllers/permissions.controller';
import companySettingsController from '@controllers/company-settings.controller';
import archiveAdminController from '@controllers/archive-admin.controller';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  createRoleSchema,
  updateRoleSchema,
  updateRolePermissionsSchema,
  updateCompanySettingsSchema,
  updateArchiveSettingsSchema,
} from '../validation/settings.validation';

const router = Router();

// All settings routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════
// USERS — /api/settings/users
// ═══════════════════════════════════════════════════════
router.get(
  '/users',
  requirePermission('settings:manage_users'),
  asyncHandler(usersController.getUsers.bind(usersController))
);

router.get(
  '/users/:id',
  requirePermission('settings:manage_users'),
  asyncHandler(usersController.getUserById.bind(usersController))
);

router.post(
  '/users',
  requirePermission('settings:manage_users'),
  validateBody(createUserSchema),
  asyncHandler(usersController.createUser.bind(usersController))
);

router.put(
  '/users/:id',
  requirePermission('settings:manage_users'),
  validateBody(updateUserSchema),
  asyncHandler(usersController.updateUser.bind(usersController))
);

router.patch(
  '/users/:id/password',
  requirePermission('settings:manage_users'),
  validateBody(changePasswordSchema),
  asyncHandler(usersController.changePassword.bind(usersController))
);

router.patch(
  '/users/:id/toggle-active',
  requirePermission('settings:manage_users'),
  asyncHandler(usersController.toggleActive.bind(usersController))
);

router.delete(
  '/users/:id',
  requirePermission('settings:manage_users'),
  asyncHandler(usersController.deleteUser.bind(usersController))
);

// ═══════════════════════════════════════════════════════
// ROLES — /api/settings/roles
// ═══════════════════════════════════════════════════════
router.get(
  '/roles',
  requirePermission('settings:read'),
  asyncHandler(rolesController.getRoles.bind(rolesController))
);

router.get(
  '/roles/:id',
  requirePermission('settings:read'),
  asyncHandler(rolesController.getRoleById.bind(rolesController))
);

router.post(
  '/roles',
  requirePermission('settings:manage_roles'),
  validateBody(createRoleSchema),
  asyncHandler(rolesController.createRole.bind(rolesController))
);

router.put(
  '/roles/:id',
  requirePermission('settings:manage_roles'),
  validateBody(updateRoleSchema),
  asyncHandler(rolesController.updateRole.bind(rolesController))
);

router.put(
  '/roles/:id/permissions',
  requirePermission('settings:manage_roles'),
  validateBody(updateRolePermissionsSchema),
  asyncHandler(rolesController.updateRolePermissions.bind(rolesController))
);

router.delete(
  '/roles/:id',
  requirePermission('settings:manage_roles'),
  asyncHandler(rolesController.deleteRole.bind(rolesController))
);

// ═══════════════════════════════════════════════════════
// PERMISSIONS — /api/settings/permissions
// ═══════════════════════════════════════════════════════
router.get(
  '/permissions',
  requirePermission('settings:read'),
  asyncHandler(permissionsController.getPermissions.bind(permissionsController))
);

router.get(
  '/permissions/grouped',
  requirePermission('settings:read'),
  asyncHandler(permissionsController.getPermissionsGrouped.bind(permissionsController))
);

// ═══════════════════════════════════════════════════════
// COMPANY SETTINGS — /api/settings/company
// ═══════════════════════════════════════════════════════
router.get(
  '/company',
  requirePermission('settings:read'),
  asyncHandler(companySettingsController.getSettings.bind(companySettingsController))
);

router.put(
  '/company',
  requirePermission('settings:manage_company'),
  validateBody(updateCompanySettingsSchema),
  asyncHandler(companySettingsController.updateSettings.bind(companySettingsController))
);

// ═══════════════════════════════════════════════════════
// ARCHIVE SETTINGS — /api/settings/archive (#144)
// ═══════════════════════════════════════════════════════
router.get(
  '/archive',
  requirePermission('settings:read'),
  asyncHandler(archiveAdminController.getArchiveSettings.bind(archiveAdminController))
);

router.put(
  '/archive',
  requirePermission('settings:manage_company'),
  validateBody(updateArchiveSettingsSchema),
  asyncHandler(archiveAdminController.updateArchiveSettings.bind(archiveAdminController))
);

router.post(
  '/archive/run-now',
  requirePermission('settings:manage_company'),
  asyncHandler(archiveAdminController.runArchiveNow.bind(archiveAdminController))
);

export default router;
