import { requireRole, requireAdmin, requireStaff } from '../../../middlewares/roles';
import { Request, Response, NextFunction } from 'express';

describe('roles middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('requireRole', () => {
    it('should call next() when user has the required role', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' } as any;
      const middleware = requireRole('ADMIN' as any);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when user has one of multiple allowed roles', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' } as any;
      const middleware = requireRole('ADMIN' as any, 'EMPLOYEE' as any);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 when user lacks the required role', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' } as any;
      const middleware = requireRole('ADMIN' as any);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Niewystarczające uprawnienia',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      req.user = undefined;
      const middleware = requireRole('ADMIN' as any);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Wymagane uwierzytelnienie',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for unknown role', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'VIEWER', roleId: '3', roleSlug: 'viewer' } as any;
      const middleware = requireRole('ADMIN' as any, 'EMPLOYEE' as any);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAdmin', () => {
    it('should allow ADMIN user', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' } as any;

      requireAdmin(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should reject EMPLOYEE user', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' } as any;

      requireAdmin(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireStaff', () => {
    it('should allow ADMIN user', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' } as any;

      requireStaff(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should allow EMPLOYEE user', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' } as any;

      requireStaff(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should reject VIEWER user', () => {
      req.user = { id: '1', email: 'a@b.com', role: 'VIEWER', roleId: '3', roleSlug: 'viewer' } as any;

      requireStaff(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject unauthenticated request', () => {
      req.user = undefined;

      requireStaff(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
