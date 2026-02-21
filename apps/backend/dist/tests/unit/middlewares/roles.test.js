import { requireRole, requireAdmin, requireStaff } from '../../../middlewares/roles';
describe('roles middleware', () => {
    let req;
    let res;
    let next;
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
            req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' };
            const middleware = requireRole('ADMIN');
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should call next() when user has one of multiple allowed roles', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' };
            const middleware = requireRole('ADMIN', 'EMPLOYEE');
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should return 403 when user lacks the required role', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' };
            const middleware = requireRole('ADMIN');
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Insufficient permissions',
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 when user is not authenticated', () => {
            req.user = undefined;
            const middleware = requireRole('ADMIN');
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required',
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 403 for unknown role', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'VIEWER', roleId: '3', roleSlug: 'viewer' };
            const middleware = requireRole('ADMIN', 'EMPLOYEE');
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    describe('requireAdmin', () => {
        it('should allow ADMIN user', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' };
            requireAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject EMPLOYEE user', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' };
            requireAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    describe('requireStaff', () => {
        it('should allow ADMIN user', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'ADMIN', roleId: '1', roleSlug: 'admin' };
            requireStaff(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should allow EMPLOYEE user', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'EMPLOYEE', roleId: '2', roleSlug: 'employee' };
            requireStaff(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject VIEWER user', () => {
            req.user = { id: '1', email: 'a@b.com', role: 'VIEWER', roleId: '3', roleSlug: 'viewer' };
            requireStaff(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
        it('should reject unauthenticated request', () => {
            req.user = undefined;
            requireStaff(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
//# sourceMappingURL=roles.test.js.map