/**
 * RolesController — Unit Tests
 * Tests CRUD validation, auth checks, slug format.
 */
jest.mock('../../../services/roles.service', () => ({
    __esModule: true,
    default: {
        getRoles: jest.fn(),
        getRoleById: jest.fn(),
        createRole: jest.fn(),
        updateRole: jest.fn(),
        updateRolePermissions: jest.fn(),
        deleteRole: jest.fn(),
    },
}));
import { RolesController } from '../../../controllers/roles.controller';
import rolesService from '../../../services/roles.service';
const controller = new RolesController();
const svc = rolesService;
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
describe('RolesController', () => {
    // ======= getRoles =======
    describe('getRoles()', () => {
        it('should return all roles', async () => {
            svc.getRoles.mockResolvedValue([{ id: 'r-1', name: 'Admin' }]);
            const response = res();
            await controller.getRoles(req(), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
        });
    });
    // ======= getRoleById =======
    describe('getRoleById()', () => {
        it('should return role by id', async () => {
            svc.getRoleById.mockResolvedValue({ id: 'r-1', name: 'Admin', permissions: [] });
            const response = res();
            await controller.getRoleById(req({ params: { id: 'r-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Admin' }) }));
        });
    });
    // ======= createRole =======
    describe('createRole()', () => {
        it('should throw 401 when no user', async () => {
            const r = req({ user: undefined, body: { name: 'Editor', slug: 'editor', permissionIds: ['p1'] } });
            await expect(controller.createRole(r, res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when name missing', async () => {
            const r = req({ body: { slug: 'editor', permissionIds: ['p1'] } });
            await expect(controller.createRole(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 when permissionIds not array', async () => {
            const r = req({ body: { name: 'Editor', slug: 'editor', permissionIds: 'not-array' } });
            await expect(controller.createRole(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 on invalid slug format (uppercase)', async () => {
            const r = req({ body: { name: 'Editor', slug: 'BadSlug!', permissionIds: ['p1'] } });
            await expect(controller.createRole(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 201 on valid creation', async () => {
            svc.createRole.mockResolvedValue({ id: 'r-new', name: 'Editor', slug: 'editor' });
            const r = req({ body: { name: 'Editor', slug: 'editor', permissionIds: ['p1', 'p2'] } });
            const response = res();
            await controller.createRole(r, response);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(svc.createRole).toHaveBeenCalledWith(expect.objectContaining({ slug: 'editor', permissionIds: ['p1', 'p2'] }), 1);
        });
    });
    // ======= updateRole =======
    describe('updateRole()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.updateRole(req({ user: undefined, params: { id: 'r-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.updateRole.mockResolvedValue({ id: 'r-1', name: 'Updated' });
            const response = res();
            await controller.updateRole(req({ params: { id: 'r-1' }, body: { name: 'Updated' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    // ======= updateRolePermissions =======
    describe('updateRolePermissions()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.updateRolePermissions(req({ user: undefined, params: { id: 'r-1' }, body: { permissionIds: [] } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when permissionIds not array', async () => {
            const r = req({ params: { id: 'r-1' }, body: { permissionIds: 'bad' } });
            await expect(controller.updateRolePermissions(r, res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 200 on valid permissions update', async () => {
            svc.updateRolePermissions.mockResolvedValue({ id: 'r-1', permissions: ['p1'] });
            const response = res();
            await controller.updateRolePermissions(req({ params: { id: 'r-1' }, body: { permissionIds: ['p1'] } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    // ======= deleteRole =======
    describe('deleteRole()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.deleteRole(req({ user: undefined, params: { id: 'r-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.deleteRole.mockResolvedValue(undefined);
            const response = res();
            await controller.deleteRole(req({ params: { id: 'r-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
//# sourceMappingURL=roles.controller.test.js.map