/**
 * Users Controller — Branch coverage tests
 * Covers: page/limit parsing, isActive ternary, email regex, !actorId, !newPassword, toggleActive message
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

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { UsersController } from '../../../controllers/users.controller';
import usersService from '../../../services/users.service';

const ctrl = new UsersController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('UsersController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUsers', () => {
    it('should parse page/limit/isActive from query', async () => {
      (usersService.getUsers as jest.Mock).mockResolvedValue({ users: [], pagination: {} });
      const req = { query: { page: '2', limit: '10', isActive: 'true', search: 'jan', sortBy: 'name', sortOrder: 'asc', roleId: 'r1' } } as any;
      await ctrl.getUsers(req, mockRes());
      expect(usersService.getUsers).toHaveBeenCalledWith(expect.objectContaining({
        page: 2, limit: 10, isActive: true, search: 'jan',
      }));
    });

    it('should pass undefined for missing page/limit/isActive', async () => {
      (usersService.getUsers as jest.Mock).mockResolvedValue({ users: [], pagination: {} });
      const req = { query: {} } as any;
      await ctrl.getUsers(req, mockRes());
      expect(usersService.getUsers).toHaveBeenCalledWith(expect.objectContaining({
        page: undefined, limit: undefined, isActive: undefined,
      }));
    });

    it('should parse isActive=false', async () => {
      (usersService.getUsers as jest.Mock).mockResolvedValue({ users: [], pagination: {} });
      const req = { query: { isActive: 'false' } } as any;
      await ctrl.getUsers(req, mockRes());
      expect(usersService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });
  });

  describe('createUser', () => {
    it('should throw unauthorized when no actorId', async () => {
      const req = { body: { email: 'a@b.pl', password: 'P', firstName: 'A', lastName: 'B', roleId: 'r1' }, user: undefined } as any;
      await expect(ctrl.createUser(req, mockRes())).rejects.toThrow();
    });

    it('should throw when missing required fields', async () => {
      const req = { body: { email: 'a@b.pl' }, user: { id: 'u1' } } as any;
      await expect(ctrl.createUser(req, mockRes())).rejects.toThrow('Wymagane pola');
    });

    it('should throw on invalid email format', async () => {
      const req = { body: { email: 'not-email', password: 'P1!', firstName: 'A', lastName: 'B', roleId: 'r1' }, user: { id: 'u1' } } as any;
      await expect(ctrl.createUser(req, mockRes())).rejects.toThrow('email');
    });

    it('should create user with valid data', async () => {
      (usersService.createUser as jest.Mock).mockResolvedValue({ id: 'u2' });
      const req = {
        body: { email: 'jan@test.pl', password: 'Pass1!', firstName: 'Jan', lastName: 'K', roleId: 'r1' },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('changePassword', () => {
    it('should throw unauthorized when no actorId', async () => {
      const req = { params: { id: 'u1' }, body: { newPassword: 'new' }, user: undefined } as any;
      await expect(ctrl.changePassword(req, mockRes())).rejects.toThrow();
    });

    it('should throw when no newPassword', async () => {
      const req = { params: { id: 'u1' }, body: {}, user: { id: 'u1' } } as any;
      await expect(ctrl.changePassword(req, mockRes())).rejects.toThrow('has\u0142o');
    });

    it('should change password successfully', async () => {
      (usersService.changePassword as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'u1' }, body: { newPassword: 'NewPass1!' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.changePassword(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Has\u0142o zmienione' }));
    });
  });

  describe('toggleActive', () => {
    it('should return aktywowany when isActive=true', async () => {
      (usersService.toggleActive as jest.Mock).mockResolvedValue({ id: 'u1', isActive: true });
      const req = { params: { id: 'u1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.toggleActive(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'U\u017cytkownik aktywowany' }));
    });

    it('should return dezaktywowany when isActive=false', async () => {
      (usersService.toggleActive as jest.Mock).mockResolvedValue({ id: 'u1', isActive: false });
      const req = { params: { id: 'u1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.toggleActive(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'U\u017cytkownik dezaktywowany' }));
    });

    it('should throw unauthorized when no actorId', async () => {
      const req = { params: { id: 'u1' }, user: undefined } as any;
      await expect(ctrl.toggleActive(req, mockRes())).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should throw unauthorized when no actorId', async () => {
      const req = { params: { id: 'u1' }, body: {}, user: undefined } as any;
      await expect(ctrl.updateUser(req, mockRes())).rejects.toThrow();
    });

    it('should update successfully', async () => {
      (usersService.updateUser as jest.Mock).mockResolvedValue({ id: 'u1' });
      const req = { params: { id: 'u1' }, body: { firstName: 'New' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.updateUser(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteUser', () => {
    it('should throw unauthorized when no actorId', async () => {
      const req = { params: { id: 'u1' }, user: undefined } as any;
      await expect(ctrl.deleteUser(req, mockRes())).rejects.toThrow();
    });

    it('should delete successfully', async () => {
      (usersService.deleteUser as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'u1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.deleteUser(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
