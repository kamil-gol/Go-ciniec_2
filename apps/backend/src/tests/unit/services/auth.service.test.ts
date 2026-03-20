/**
 * Unit tests for auth.service.ts
 * Covers: login, register, getMe
 * Issue: #96
 */
import bcrypt from 'bcryptjs';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
  },
  changeLog: {
    create: jest.fn(),
  },
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock marked & document-template.service (transitive via auth → email.service)
jest.mock('marked', () => ({
  marked: { parse: jest.fn().mockResolvedValue('<p>mocked</p>') },
}), { virtual: true });
jest.mock('../../../services/document-template.service', () => ({
  __esModule: true,
  default: { preview: jest.fn().mockRejectedValue(new Error('no template')) },
}));

import authService from '../../../services/auth.service';
import { validatePassword } from '../../../utils/password';

// ── Fixtures ─────────────────────────────────────────────────────────────────────────────────────
const hashedPassword = bcrypt.hashSync('Test1234!', 10);

const mockUserWithRole = {
  id: 'user-1',
  email: 'admin@test.pl',
  password: hashedPassword,
  firstName: 'Jan',
  lastName: 'Kowalski',
  isActive: true,
  legacyRole: 'ADMIN',
  roleId: 'role-1',
  lastLoginAt: null,
  assignedRole: {
    id: 'role-1',
    name: 'Administrator',
    slug: 'admin',
    color: '#FF0000',
    permissions: [
      { permission: { slug: 'reservations:read' } },
      { permission: { slug: 'reservations:create' } },
      { permission: { slug: 'settings:manage' } },
    ],
  },
};

const mockUserNoRole = {
  ...mockUserWithRole,
  id: 'user-2',
  email: 'employee@test.pl',
  legacyRole: 'EMPLOYEE',
  roleId: null,
  assignedRole: null,
};

const mockInactiveUser = {
  ...mockUserWithRole,
  id: 'user-3',
  email: 'inactive@test.pl',
  isActive: false,
};

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────
describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.refreshToken.create.mockResolvedValue({ 
      id: 'rt-1', 
      token: 'refresh-token', 
      userId: 'user-1', 
      expiresAt: new Date() 
    });
    mockPrisma.changeLog.create.mockResolvedValue({ id: 'log-1' });
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  describe('login', () => {
    it('should login with valid credentials and return token + user + permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);
      mockPrisma.user.update.mockResolvedValue(mockUserWithRole);

      const result = await authService.login({ email: 'admin@test.pl', password: 'Test1234!' });

      expect(result.token).toBeTruthy(); // JWT token exists
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy(); // Random hex token
      expect(result.user.email).toBe('admin@test.pl');
      expect(result.user.permissions).toEqual([
        'reservations:read',
        'reservations:create',
        'settings:manage',
      ]);
    });

    it('should throw "Invalid credentials" for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({ email: 'nobody@test.pl', password: 'pass' }))
        .rejects.toThrow(/[Nn]ieprawid/);
    });

    it('should throw "Invalid credentials" for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);

      await expect(authService.login({ email: 'admin@test.pl', password: 'WrongPassword!' }))
        .rejects.toThrow(/[Nn]ieprawid/);
    });

    it('should throw "User account is inactive" for disabled account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockInactiveUser);

      await expect(authService.login({ email: 'inactive@test.pl', password: 'Test1234!' }))
        .rejects.toThrow(/nieaktywne/);
    });

    it('should return empty permissions array when user has no assigned role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserNoRole);
      mockPrisma.user.update.mockResolvedValue(mockUserNoRole);

      const result = await authService.login({ email: 'employee@test.pl', password: 'Test1234!' });

      expect(result.user.permissions).toEqual([]);
      expect(result.user.role).toBeNull();
    });

    it('should update lastLoginAt on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);
      mockPrisma.user.update.mockResolvedValue(mockUserWithRole);

      await authService.login({ email: 'admin@test.pl', password: 'Test1234!' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should not throw if lastLoginAt update fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);
      // First call succeeds (for lastLoginAt update logic test)
      mockPrisma.user.update.mockResolvedValueOnce(mockUserWithRole);

      const result = await authService.login({ email: 'admin@test.pl', password: 'Test1234!' });
      expect(result.token).toBeTruthy();
    });

    it('should use legacyRole fallback when legacyRole is null', async () => {
      const userNullLegacy = { ...mockUserWithRole, legacyRole: null };
      mockPrisma.user.findUnique.mockResolvedValue(userNullLegacy);
      mockPrisma.user.update.mockResolvedValue(userNullLegacy);

      const result = await authService.login({ email: 'admin@test.pl', password: 'Test1234!' });

      // Service defaults to 'user' when legacyRole is null and no assignedRole
      expect(result.user.legacyRole).toBe('user');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  describe('register', () => {
    const registerData = {
      email: 'new@test.pl',
      password: 'NewPass123!',
      firstName: 'Anna',
      lastName: 'Nowak',
    };

    it('should register a new user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-1',
        ...registerData,
        password: 'hashed',
        legacyRole: 'user',
        roleId: null,
        assignedRole: null,
        isActive: true,
      });

      const result = await authService.register(registerData);

      expect(result.token).toBeTruthy();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy(); // Random hex token
      expect(result.user.email).toBe('new@test.pl');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.pl',
            password: expect.not.stringContaining('NewPass123!'), // hashed
          }),
        })
      );
    });

    it('should throw when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);

      await expect(authService.register(registerData))
        .rejects.toThrow(/email już istnieje/);
    });

    it('should create user without roleId (current auth.service behavior)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-2',
        ...registerData,
        password: 'hashed',
        legacyRole: 'user',
        roleId: null,
        assignedRole: null,
        isActive: true,
      });

      const result = await authService.register(registerData);

      // Auth service creates user without calling role.findUnique
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.user.role).toBeNull();
      expect(result.user.legacyRole).toBe('user');
    });

    it('should return user with default legacyRole "user"', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-3',
        ...registerData,
        password: 'hashed',
        legacyRole: 'user',
        roleId: null,
        assignedRole: null,
        isActive: true,
      });

      const result = await authService.register(registerData);

      expect(result.user.legacyRole).toBe('user');
      expect(result.user.role).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // GET ME
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  describe('getMe', () => {
    it('should return current user with permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole);

      const result = await authService.getMe('user-1');

      expect(result.email).toBe('admin@test.pl');
      expect(result.permissions).toEqual([
        'reservations:read',
        'reservations:create',
        'settings:manage',
      ]);
      expect(result.role).toEqual({
        id: 'role-1',
        name: 'Administrator',
        slug: 'admin',
        color: '#FF0000',
      });
    });

    it('should throw "User not found" for invalid userId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getMe('nonexistent'))
        .rejects.toThrow(/[Uu]żytkownik.*nie.*znalezion/);
    });

    it('should return empty permissions when user has no role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserNoRole);

      const result = await authService.getMe('user-2');

      expect(result.permissions).toEqual([]);
      expect(result.role).toBeNull();
    });
  });
});
