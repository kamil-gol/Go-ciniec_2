/**
 * UsersController — Unit Tests
 * Tests CRUD validation, auth checks.
 */
jest.mock('../../../services/users.service', () => ({
    __esModule: true,
    default: {
        getUsers: jest.fn(),
        getUserById: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn(),
        changePassword: jest.fn(),
        toggleActive: jest.fn(),
        deleteUser: jest.fn(),
    },
}));
import { UsersController } from '../../../controllers/users.controller';
import usersService from '../../../services/users.service';
const controller = new UsersController();
const svc = usersService;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {}, user: { id: 1 },
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('UsersController', () => {
    // ======= getUsers =======
    describe('getUsers()', () => {
        it('should return users with pagination', async () => {
            svc.getUsers.mockResolvedValue({ users: [{ id: 'u-1' }], pagination: { page: 1 } });
            const response = res();
            await controller.getUsers(req({ query: { page: '1', limit: '20' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, pagination: expect.any(Object) }));
        });
    });
    // ======= getUserById =======
    describe('getUserById()', () => {
        it('should return user by id', async () => {
            svc.getUserById.mockResolvedValue({ id: 'u-1', email: 'a@b.pl' });
            const response = res();
            await controller.getUserById(req({ params: { id: 'u-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'u-1', email: 'a@b.pl' } }));
        });
    });
    // ======= createUser =======
    describe('createUser()', () => {
        it('should throw 401 when no user', async () => {
            const r = req({ user: undefined, body: { email: 'a@b.pl', password: 'x', firstName: 'J', lastName: 'K', roleId: 'r1' } });
            await expect(controller.createUser(r, res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when required fields missing', async () => {
            const r = req({ body: { email: 'a@b.pl' } });
            await expect(controller.createUser(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 on invalid email format', async () => {
            const r = req({ body: { email: 'bad-email', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski', roleId: 'r1' } });
            await expect(controller.createUser(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 201 on valid creation', async () => {
            svc.createUser.mockResolvedValue({ id: 'u-new', email: 'jan@test.pl' });
            const r = req({ body: { email: 'jan@test.pl', password: 'Test123!', firstName: 'Jan', lastName: 'Kowalski', roleId: 'r1' } });
            const response = res();
            await controller.createUser(r, response);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(svc.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'jan@test.pl', roleId: 'r1' }), 1);
        });
    });
    // ======= updateUser =======
    describe('updateUser()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.updateUser(req({ user: undefined, params: { id: 'u-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.updateUser.mockResolvedValue({ id: 'u-1' });
            const response = res();
            await controller.updateUser(req({ params: { id: 'u-1' }, body: { firstName: 'Updated' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    // ======= changePassword =======
    describe('changePassword()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.changePassword(req({ user: undefined, params: { id: 'u-1' }, body: { newPassword: 'x' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when newPassword missing', async () => {
            const r = req({ params: { id: 'u-1' }, body: {} });
            await expect(controller.changePassword(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 200 on success', async () => {
            svc.changePassword.mockResolvedValue(undefined);
            const response = res();
            await controller.changePassword(req({ params: { id: 'u-1' }, body: { newPassword: 'NewPass123!' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    // ======= toggleActive =======
    describe('toggleActive()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.toggleActive(req({ user: undefined, params: { id: 'u-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 with status message', async () => {
            svc.toggleActive.mockResolvedValue({ id: 'u-1', isActive: false });
            const response = res();
            await controller.toggleActive(req({ params: { id: 'u-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('dezaktywowany') }));
        });
    });
    // ======= deleteUser =======
    describe('deleteUser()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.deleteUser(req({ user: undefined, params: { id: 'u-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.deleteUser.mockResolvedValue(undefined);
            const response = res();
            await controller.deleteUser(req({ params: { id: 'u-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
//# sourceMappingURL=users.controller.test.js.map