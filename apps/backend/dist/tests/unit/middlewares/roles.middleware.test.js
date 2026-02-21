/**
 * Roles Middleware — Unit Tests
 */
import { requireRole, requireAdmin, requireStaff } from '../../../middlewares/roles';
const mockReq = (user) => ({ user });
const mockRes = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
const mockNext = jest.fn();
beforeEach(() => jest.clearAllMocks());
describe('Roles Middleware', () => {
    describe('requireRole()', () => {
        it('should call next() when user has allowed role', () => {
            const mw = requireRole('ADMIN', 'EMPLOYEE');
            mw(mockReq({ role: 'EMPLOYEE' }), mockRes(), mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should return 401 when no user', () => {
            const mw = requireRole('ADMIN');
            const response = mockRes();
            mw(mockReq(), response, mockNext);
            expect(response.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 403 when role not allowed', () => {
            const mw = requireRole('ADMIN');
            const response = mockRes();
            mw(mockReq({ role: 'READONLY' }), response, mockNext);
            expect(response.status).toHaveBeenCalledWith(403);
        });
    });
    describe('requireAdmin', () => {
        it('should allow ADMIN', () => {
            requireAdmin(mockReq({ role: 'ADMIN' }), mockRes(), mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject EMPLOYEE', () => {
            const response = mockRes();
            requireAdmin(mockReq({ role: 'EMPLOYEE' }), response, mockNext);
            expect(response.status).toHaveBeenCalledWith(403);
        });
    });
    describe('requireStaff', () => {
        it('should allow ADMIN', () => {
            requireStaff(mockReq({ role: 'ADMIN' }), mockRes(), mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should allow EMPLOYEE', () => {
            requireStaff(mockReq({ role: 'EMPLOYEE' }), mockRes(), mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject READONLY', () => {
            const response = mockRes();
            requireStaff(mockReq({ role: 'READONLY' }), response, mockNext);
            expect(response.status).toHaveBeenCalledWith(403);
        });
    });
});
//# sourceMappingURL=roles.middleware.test.js.map