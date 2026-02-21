import {
  MODULE_LABELS,
  ACTION_LABELS,
  PERMISSION_DEFINITIONS,
  ROLE_DEFINITIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
} from '../../../constants/permissions';

describe('permissions constants', () => {
  describe('PERMISSION_DEFINITIONS', () => {
    it('should have at least 30 permissions', () => {
      expect(PERMISSION_DEFINITIONS.length).toBeGreaterThanOrEqual(30);
    });

    it('every permission should have 5 elements [slug, module, action, name, description]', () => {
      PERMISSION_DEFINITIONS.forEach(([slug, module, action, name, desc]) => {
        expect(slug).toBeDefined();
        expect(module).toBeDefined();
        expect(action).toBeDefined();
        expect(name).toBeDefined();
        expect(desc).toBeDefined();
      });
    });

    it('slug should match module:action pattern', () => {
      PERMISSION_DEFINITIONS.forEach(([slug, module, action]) => {
        expect(slug).toBe(`${module}:${action}`);
      });
    });

    it('should have no duplicate slugs', () => {
      const slugs = PERMISSION_DEFINITIONS.map(([s]) => s);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
    });

    it('every module should have a label in MODULE_LABELS', () => {
      const modules = new Set(PERMISSION_DEFINITIONS.map(([, m]) => m));
      modules.forEach((m) => {
        expect(MODULE_LABELS[m]).toBeDefined();
      });
    });
  });

  describe('ROLE_DEFINITIONS', () => {
    it('should define admin, manager, employee, viewer', () => {
      expect(ROLE_DEFINITIONS.admin).toBeDefined();
      expect(ROLE_DEFINITIONS.manager).toBeDefined();
      expect(ROLE_DEFINITIONS.employee).toBeDefined();
      expect(ROLE_DEFINITIONS.viewer).toBeDefined();
    });

    it('admin should have ALL permissions', () => {
      expect(ROLE_DEFINITIONS.admin.permissions).toBe('ALL');
    });

    it('admin should be system role', () => {
      expect(ROLE_DEFINITIONS.admin.isSystem).toBe(true);
    });

    it('every non-admin role permission should exist in PERMISSION_DEFINITIONS', () => {
      const allSlugs = new Set(PERMISSION_DEFINITIONS.map(([s]) => s));
      ['manager', 'employee', 'viewer'].forEach((role) => {
        const perms = ROLE_DEFINITIONS[role].permissions as string[];
        perms.forEach((p) => {
          expect(allSlugs.has(p)).toBe(true);
        });
      });
    });

    it('manager should have more permissions than employee', () => {
      const managerPerms = ROLE_DEFINITIONS.manager.permissions as string[];
      const employeePerms = ROLE_DEFINITIONS.employee.permissions as string[];
      expect(managerPerms.length).toBeGreaterThan(employeePerms.length);
    });

    it('employee should have more permissions than viewer', () => {
      const employeePerms = ROLE_DEFINITIONS.employee.permissions as string[];
      const viewerPerms = ROLE_DEFINITIONS.viewer.permissions as string[];
      expect(employeePerms.length).toBeGreaterThan(viewerPerms.length);
    });

    it('viewer should only have read permissions', () => {
      const viewerPerms = ROLE_DEFINITIONS.viewer.permissions as string[];
      viewerPerms.forEach((p) => {
        expect(p).toMatch(/:read$/);
      });
    });

    it('every role should have slug, name, description, color', () => {
      Object.values(ROLE_DEFINITIONS).forEach((role) => {
        expect(role.slug).toBeDefined();
        expect(role.name).toBeDefined();
        expect(role.description).toBeDefined();
        expect(role.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('DEFAULT_EMPLOYEE_PERMISSIONS', () => {
    it('should be same as employee role permissions', () => {
      expect(DEFAULT_EMPLOYEE_PERMISSIONS).toEqual(ROLE_DEFINITIONS.employee.permissions);
    });

    it('should include dashboard:read', () => {
      expect(DEFAULT_EMPLOYEE_PERMISSIONS).toContain('dashboard:read');
    });
  });

  describe('MODULE_LABELS', () => {
    it('should have labels for standard modules', () => {
      expect(MODULE_LABELS.dashboard).toBe('Dashboard');
      expect(MODULE_LABELS.reservations).toBe('Rezerwacje');
      expect(MODULE_LABELS.deposits).toBe('Zaliczki');
    });
  });

  describe('ACTION_LABELS', () => {
    it('should have labels for standard actions', () => {
      expect(ACTION_LABELS.read).toBeDefined();
      expect(ACTION_LABELS.create).toBeDefined();
      expect(ACTION_LABELS.update).toBeDefined();
      expect(ACTION_LABELS.delete).toBeDefined();
    });
  });
});
