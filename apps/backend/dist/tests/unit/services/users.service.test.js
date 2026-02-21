// ── Mocks ────────────────────────────────────────────────
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    role: {
        findUnique: jest.fn(),
    },
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/password', () => ({
    validatePassword: jest.fn(),
}));
jest.mock('@utils/AppError', () => ({
    AppError: {
        notFound: (msg) => { const e = new Error(`${msg} nie znaleziono`); e.statusCode = 404; return e; },
        conflict: (msg) => { const e = new Error(msg); e.statusCode = 409; return e; },
        badRequest: (msg) => { const e = new Error(msg); e.statusCode = 400; return e; },
    },
}));
jest.mock('@utils/audit-logger', () => ({
    logChange: jest.fn(),
}));
jest.mock('@middlewares/permissions', () => ({
    invalidatePermissionCache: jest.fn(),
}));
jest.mock('@utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));
import UsersService from '@services/users.service';
import { validatePassword } from '@utils/password';
import { invalidatePermissionCache } from '@middlewares/permissions';
import { logChange } from '@utils/audit-logger';
// ── Fixtures ─────────────────────────────────────────────
const mockRole = { id: 'role-1', name: 'Admin', slug: 'admin', color: '#F00' };
const mockUser = {
    id: 'user-1',
    email: 'jan@test.pl',
    firstName: 'Jan',
    lastName: 'Kowalski',
    isActive: true,
    lastLoginAt: null,
    legacyRole: 'ADMIN',
    roleId: 'role-1',
    assignedRole: mockRole,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};
const mockUserWithPerms = {
    ...mockUser,
    assignedRole: {
        ...mockRole,
        permissions: [
            { permission: { slug: 'reservations:read' } },
            { permission: { slug: 'settings:manage' } },
        ],
    },
};
describe('UsersService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // ═══════════════ getUsers ═══════════════
    describe('getUsers', () => {
        it('should return paginated users list', async () => {
            mockPrisma.user.findMany.mockResolvedValue([mockUser]);
            mockPrisma.user.count.mockResolvedValue(1);
            const result = await UsersService.getUsers({ page: 1, limit: 20 });
            expect(result.users).toHaveLength(1);
            expect(result.users[0].email).toBe('jan@test.pl');
            expect(result.pagination).toEqual({
                page: 1, limit: 20, total: 1, totalPages: 1,
            });
        });
        it('should apply search filter across name and email', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);
            await UsersService.getUsers({ search: 'kowalski' });
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        { firstName: { contains: 'kowalski', mode: 'insensitive' } },
                        { lastName: { contains: 'kowalski', mode: 'insensitive' } },
                        { email: { contains: 'kowalski', mode: 'insensitive' } },
                    ]),
                }),
            }));
        });
        it('should filter by roleId', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);
            await UsersService.getUsers({ roleId: 'role-1' });
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ roleId: 'role-1' }),
            }));
        });
    });
    // ═══════════════ getUserById ═══════════════
    describe('getUserById', () => {
        it('should return user with permissions', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPerms);
            const result = await UsersService.getUserById('user-1');
            expect(result.email).toBe('jan@test.pl');
            expect(result.permissions).toEqual(['reservations:read', 'settings:manage']);
        });
        it('should throw 404 when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(UsersService.getUserById('nonexistent'))
                .rejects.toThrow(/nie znaleziono/);
        });
    });
    // ═══════════════ createUser ═══════════════
    describe('createUser', () => {
        const createData = {
            email: 'new@test.pl',
            password: 'NewPass123!',
            firstName: 'Anna',
            lastName: 'Nowak',
            roleId: 'role-1',
        };
        it('should create user with hashed password and log change', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null); // no duplicate
            mockPrisma.role.findUnique.mockResolvedValue(mockRole);
            mockPrisma.user.create.mockResolvedValue({ ...mockUser, id: 'new-1', email: 'new@test.pl' });
            const result = await UsersService.createUser(createData, 'actor-1');
            expect(result.email).toBe('new@test.pl');
            expect(validatePassword).toHaveBeenCalledWith('NewPass123!');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED', entityType: 'User' }));
            // Password should be hashed (not plaintext)
            expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    password: expect.not.stringContaining('NewPass123!'),
                }),
            }));
        });
        it('should throw conflict when email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(UsersService.createUser(createData, 'actor-1'))
                .rejects.toThrow(/email/);
        });
        it('should throw 404 when roleId does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue(null);
            await expect(UsersService.createUser(createData, 'actor-1'))
                .rejects.toThrow(/nie znaleziono/);
        });
    });
    // ═══════════════ updateUser ═══════════════
    describe('updateUser', () => {
        it('should update user and log change', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, firstName: 'Janusz' });
            const result = await UsersService.updateUser('user-1', { firstName: 'Janusz' }, 'actor-1');
            expect(result.firstName).toBe('Janusz');
            expect(logChange).toHaveBeenCalled();
        });
        it('should throw conflict when new email is already taken', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(mockUser) // existing user
                .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // email taken
            await expect(UsersService.updateUser('user-1', { email: 'taken@test.pl' }, 'actor-1'))
                .rejects.toThrow(/email/);
        });
        it('should invalidate permission cache when roleId changes', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-2', name: 'Employee' });
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, roleId: 'role-2' });
            await UsersService.updateUser('user-1', { roleId: 'role-2' }, 'actor-1');
            expect(invalidatePermissionCache).toHaveBeenCalledWith('user-1');
        });
    });
    // ═══════════════ changePassword ═══════════════
    describe('changePassword', () => {
        it('should hash new password and update user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue(mockUser);
            await UsersService.changePassword('user-1', 'NewSecure123!', 'actor-1');
            expect(validatePassword).toHaveBeenCalledWith('NewSecure123!');
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { password: expect.any(String) },
            });
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_PASSWORD_CHANGED' }));
        });
        it('should throw 404 when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(UsersService.changePassword('nonexistent', 'pass', 'actor-1'))
                .rejects.toThrow(/nie znaleziono/);
        });
    });
    // ═══════════════ toggleActive ═══════════════
    describe('toggleActive', () => {
        it('should toggle isActive from true to false', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });
            const result = await UsersService.toggleActive('user-1', 'other-actor');
            expect(result.isActive).toBe(false);
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DEACTIVATED' }));
        });
        it('should throw when trying to deactivate own account', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(UsersService.toggleActive('user-1', 'user-1'))
                .rejects.toThrow(/własnego konta/);
        });
    });
    // ═══════════════ deleteUser ═══════════════
    describe('deleteUser', () => {
        it('should soft-delete user (set isActive=false) and invalidate cache', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });
            await UsersService.deleteUser('user-1', 'other-actor');
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { isActive: false },
            });
            expect(invalidatePermissionCache).toHaveBeenCalledWith('user-1');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DELETED' }));
        });
        it('should throw when trying to delete own account', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(UsersService.deleteUser('user-1', 'user-1'))
                .rejects.toThrow(/własnego konta/);
        });
        it('should throw 404 when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(UsersService.deleteUser('nonexistent', 'actor-1'))
                .rejects.toThrow(/nie znaleziono/);
        });
    });
});
//# sourceMappingURL=users.service.test.js.map