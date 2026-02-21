const mockHallService = {
    getHalls: jest.fn(),
    getHallById: jest.fn(),
    createHall: jest.fn(),
    updateHall: jest.fn(),
    deleteHall: jest.fn(),
};
jest.mock('../../../services/hall.service', () => ({
    __esModule: true,
    default: mockHallService,
}));
import hallController from '../../../controllers/hall.controller';
const mockReq = (overrides = {}) => ({
    query: {},
    params: {},
    body: {},
    headers: {},
    ...overrides,
});
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();
beforeEach(() => jest.clearAllMocks());
describe('HallController — error paths', () => {
    it('getHalls should call next(error) when service throws', async () => {
        const error = new Error('DB connection failed');
        mockHallService.getHalls.mockRejectedValue(error);
        await hallController.getHalls(mockReq({ query: {} }), mockRes(), mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });
    it('getHallById should call next(error) when service throws', async () => {
        const error = new Error('Hall not found');
        mockHallService.getHallById.mockRejectedValue(error);
        await hallController.getHallById(mockReq({ params: { id: 'bad-id' } }), mockRes(), mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });
    it('getHalls with isActive=false filter', async () => {
        mockHallService.getHalls.mockResolvedValue([]);
        const res = mockRes();
        await hallController.getHalls(mockReq({ query: { isActive: 'false' } }), res, mockNext);
        expect(mockHallService.getHalls).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
        expect(res.json).toHaveBeenCalled();
    });
    it('getHalls with no isActive filter (undefined)', async () => {
        mockHallService.getHalls.mockResolvedValue([]);
        const res = mockRes();
        await hallController.getHalls(mockReq({ query: { search: 'Sala' } }), res, mockNext);
        expect(mockHallService.getHalls).toHaveBeenCalledWith(expect.objectContaining({ isActive: undefined }));
    });
});
//# sourceMappingURL=hall.controller.branches.test.js.map