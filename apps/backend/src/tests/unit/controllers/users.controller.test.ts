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
const svc = usersService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 1 },
  ...overrides,
});

const res = () => {
  const r: any = {};
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, pagination: expect.any(Object) })
      );
    });
  });

  // ======= getUserById =======
  describe('getUserById()', () => {
    it('should return user by id', async () => {
      svc.getUserById.mockResolvedValue({ id: 'u-1', email: 'a@b.pl' });
      const response = res();
      await controller.getUserById(req({ params: { id: 'u-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: 'u-1', email: 'a@b.pl' } })
      );
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
      expect(svc.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jan@test.pl', roleId: 'r1' }), 1
      );
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
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('dezaktywowany') })
      );
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

  describe('edge cases / branch coverage', () => {
    describe('getUsers — branch', () => {
      it('should parse page/limit/isActive from query', async () => {
        svc.getUsers.mockResolvedValue({ users: [], pagination: {} });
        const r = req({ query: { page: '2', limit: '10', isActive: 'true', search: 'jan', sortBy: 'name', sortOrder: 'asc', roleId: 'r1' } });
        await controller.getUsers(r, res());
        expect(svc.getUsers).toHaveBeenCalledWith(expect.objectContaining({
          page: 2, limit: 10, isActive: true, search: 'jan',
        }));
      });

      it('should pass undefined for missing page/limit/isActive', async () => {
        svc.getUsers.mockResolvedValue({ users: [], pagination: {} });
        const r = req({ query: {} });
        await controller.getUsers(r, res());
        expect(svc.getUsers).toHaveBeenCalledWith(expect.objectContaining({
          page: undefined, limit: undefined, isActive: undefined,
        }));
      });

      it('should parse isActive=false', async () => {
        svc.getUsers.mockResolvedValue({ users: [], pagination: {} });
        const r = req({ query: { isActive: 'false' } });
        await controller.getUsers(r, res());
        expect(svc.getUsers).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
      });
    });

    describe('createUser — branch', () => {
      it('should throw when missing required fields (branch)', async () => {
        const r = req({ body: { email: 'a@b.pl' } });
        await expect(controller.createUser(r, res())).rejects.toThrow();
      });

      it('should throw on invalid email format (branch)', async () => {
        const r = req({ body: { email: 'not-email', password: 'P1!', firstName: 'A', lastName: 'B', roleId: 'r1' } });
        await expect(controller.createUser(r, res())).rejects.toThrow();
      });

      it('should create user with valid data (branch)', async () => {
        svc.createUser.mockResolvedValue({ id: 'u2' });
        const r = req({
          body: { email: 'jan@test.pl', password: 'Pass1!', firstName: 'Jan', lastName: 'K', roleId: 'r1' },
        });
        const response = res();
        await controller.createUser(r, response);
        expect(response.status).toHaveBeenCalledWith(201);
      });
    });

    describe('changePassword — branch', () => {
      it('should throw when no newPassword (branch)', async () => {
        const r = req({ params: { id: 'u1' }, body: {} });
        await expect(controller.changePassword(r, res())).rejects.toThrow();
      });

      it('should change password successfully (branch)', async () => {
        svc.changePassword.mockResolvedValue(undefined);
        const r = req({ params: { id: 'u1' }, body: { newPassword: 'NewPass1!' } });
        const response = res();
        await controller.changePassword(r, response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Has\u0142o') }));
      });
    });

    describe('toggleActive — branch', () => {
      it('should return aktywowany when isActive=true', async () => {
        svc.toggleActive.mockResolvedValue({ id: 'u1', isActive: true });
        const r = req({ params: { id: 'u1' } });
        const response = res();
        await controller.toggleActive(r, response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('aktywowany') }));
      });

      it('should return dezaktywowany when isActive=false (branch)', async () => {
        svc.toggleActive.mockResolvedValue({ id: 'u1', isActive: false });
        const r = req({ params: { id: 'u1' } });
        const response = res();
        await controller.toggleActive(r, response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('dezaktywowany') }));
      });
    });

    describe('updateUser — branch', () => {
      it('should update successfully (branch)', async () => {
        svc.updateUser.mockResolvedValue({ id: 'u1' });
        const r = req({ params: { id: 'u1' }, body: { firstName: 'New' } });
        const response = res();
        await controller.updateUser(r, response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });
    });

    describe('deleteUser — branch', () => {
      it('should delete successfully (branch)', async () => {
        svc.deleteUser.mockResolvedValue(undefined);
        const r = req({ params: { id: 'u1' } });
        const response = res();
        await controller.deleteUser(r, response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });
    });
  });
});
