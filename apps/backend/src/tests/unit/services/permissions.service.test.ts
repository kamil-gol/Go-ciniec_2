/**
 * PermissionsService — Unit Tests
 * Covers getPermissions() + getPermissionsGrouped() with branch coverage
 * for if(!grouped[module]) and MODULE_LABELS || fallback.
 */

jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    permission: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../constants/permissions', () => ({
  MODULE_LABELS: {
    reservations: 'Rezerwacje',
    settings: 'Ustawienia',
    clients: 'Klienci',
    halls: 'Sale',
  },
}));

import { prisma } from '../../../lib/prisma';

const mockFindMany = (prisma as any).permission.findMany as jest.Mock;

const PERMISSIONS = [
  { id: 'p-001', module: 'reservations', action: 'manage', slug: 'reservations.manage', name: 'Zarządzaj', description: 'Full access' },
  { id: 'p-002', module: 'reservations', action: 'view', slug: 'reservations.view', name: 'Podgląd', description: 'Read only' },
  { id: 'p-003', module: 'settings', action: 'manage', slug: 'settings.manage', name: 'Ustawienia', description: '' },
  { id: 'p-004', module: 'custom_unknown', action: 'view', slug: 'custom_unknown.view', name: 'Unknown', description: 'No label' },
];

let service: any;

beforeAll(async () => {
  const mod = await import('../../../services/permissions.service');
  service = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue(PERMISSIONS);
});

describe('PermissionsService', () => {
  describe('getPermissions()', () => {
    it('should return all permissions mapped', async () => {
      const result = await service.getPermissions();

      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      });
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        id: 'p-001', module: 'reservations', action: 'manage',
        slug: 'reservations.manage', name: 'Zarządzaj', description: 'Full access',
      });
    });

    it('should return empty array when no permissions', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await service.getPermissions();
      expect(result).toEqual([]);
    });
  });

  describe('getPermissionsGrouped()', () => {
    it('should group permissions by module', async () => {
      const result = await service.getPermissionsGrouped();

      expect(result).toHaveLength(3); // reservations, settings, custom_unknown

      const reservationsGroup = result.find((g: any) => g.module === 'reservations');
      expect(reservationsGroup).toBeDefined();
      expect(reservationsGroup.permissions).toHaveLength(2);
      expect(reservationsGroup.moduleLabel).toBe('Rezerwacje');
    });

    it('should use MODULE_LABELS for known modules', async () => {
      const result = await service.getPermissionsGrouped();

      const settingsGroup = result.find((g: any) => g.module === 'settings');
      expect(settingsGroup.moduleLabel).toBe('Ustawienia');
    });

    it('should fallback to module name when no label exists', async () => {
      const result = await service.getPermissionsGrouped();

      const unknownGroup = result.find((g: any) => g.module === 'custom_unknown');
      expect(unknownGroup).toBeDefined();
      expect(unknownGroup.moduleLabel).toBe('custom_unknown'); // fallback
    });

    it('should handle second permission in same module (grouped[module] already exists)', async () => {
      const result = await service.getPermissionsGrouped();

      const reservationsGroup = result.find((g: any) => g.module === 'reservations');
      // Both p-001 and p-002 should be in same group
      expect(reservationsGroup.permissions).toHaveLength(2);
      expect(reservationsGroup.permissions[0].slug).toBe('reservations.manage');
      expect(reservationsGroup.permissions[1].slug).toBe('reservations.view');
    });

    it('should return empty array when no permissions', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await service.getPermissionsGrouped();
      expect(result).toEqual([]);
    });
  });
});
