/**
 * EventTypeController — Branch Coverage Tests
 * Targets:
 *   - createEventType(): name required guard
 *   - getEventTypeById(): not-found case
 */

jest.mock('../../../services/eventType.service', () => ({
  EventTypeService: jest.fn().mockImplementation(() => ({
    createEventType: jest.fn(),
    getEventTypeById: jest.fn(),
  })),
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(msg: string, code: number) {
      super(msg);
      this.statusCode = code;
    }
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { EventTypeController } from '../../../controllers/eventType.controller';
import { EventTypeService } from '../../../services/eventType.service';

const eventTypeService = new EventTypeService();
const ctrl = new EventTypeController(eventTypeService as any);

function mockRes() {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('EventTypeController branches', () => {
  describe('createEventType', () => {
    it('should throw badRequest when no name', async () => {
      const req = { body: {}, user: { id: 'u1' } } as any;
      await expect(ctrl.createEventType(req, mockRes())).rejects.toThrow(/wymagan|required/i);
    });

    it('should create with all fields', async () => {
      (eventTypeService.createEventType as jest.Mock).mockResolvedValue({ id: 'et-1', name: 'Wesele' });
      const req = { body: { name: 'Wesele', color: '#fff', icon: 'cake' }, user: { id: 'u1' } } as any;
      const response = mockRes();
      await ctrl.createEventType(req, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });
  });

  describe('getEventTypeById', () => {
    it('should throw notFound when null', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      await expect(ctrl.getEventTypeById(req, mockRes())).rejects.toThrow(/Nie znaleziono|not found/i);
    });

    it('should return eventType when found', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue({ id: 'et-1', name: 'Wesele' });
      const req = { params: { id: 'et-1' } } as any;
      const response = mockRes();
      await ctrl.getEventTypeById(req, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ id: 'et-1' }) })
      );
    });
  });
});
