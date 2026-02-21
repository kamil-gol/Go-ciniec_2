import { validateUUID } from '../../../middlewares/validateUUID';
describe('validateUUID', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });
    const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
    const VALID_UUID_UPPER = '550E8400-E29B-41D4-A716-446655440000';
    const NIL_UUID = '00000000-0000-0000-0000-000000000000';
    // --- Happy paths ---
    it('should call next() for valid UUID', () => {
        req.params = { id: VALID_UUID };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
    it('should accept uppercase UUIDs', () => {
        req.params = { id: VALID_UUID_UPPER };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('should accept nil UUID (all zeros)', () => {
        req.params = { id: NIL_UUID };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('should call next() when param is not present', () => {
        req.params = {};
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('should validate multiple params - all valid', () => {
        req.params = { id: VALID_UUID, itemId: NIL_UUID };
        const middleware = validateUUID('id', 'itemId');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    // --- Rejection paths ---
    it('should return 400 for invalid UUID', () => {
        req.params = { id: 'not-a-uuid' };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Invalid ID format for parameter 'id'",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 for partial UUID', () => {
        req.params = { id: '550e8400-e29b-41d4' };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 400 for UUID without dashes', () => {
        req.params = { id: '550e8400e29b41d4a716446655440000' };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 400 for numeric string', () => {
        req.params = { id: '12345' };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should reject on first invalid param in multiple params', () => {
        req.params = { id: 'bad-id', itemId: VALID_UUID };
        const middleware = validateUUID('id', 'itemId');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Invalid ID format for parameter 'id'",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it('should reject on second invalid param', () => {
        req.params = { id: VALID_UUID, itemId: 'garbage' };
        const middleware = validateUUID('id', 'itemId');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Invalid ID format for parameter 'itemId'",
        });
    });
    it('should return 400 for UUID with extra chars', () => {
        req.params = { id: VALID_UUID + 'x' };
        const middleware = validateUUID('id');
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
//# sourceMappingURL=validateUUID.test.js.map