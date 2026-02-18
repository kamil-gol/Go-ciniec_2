/**
 * EventType Controller — Branch coverage tests
 * Covers: !userId, !name, !eventType, isActive filter, conditional update fields
 */

jest.mock('../../../services/eventType.service', () => ({
  __esModule: true,
  default: {
    createEventType: jest.fn(),
    getEventTypes: jest.fn(),
    getEventTypeById: jest.fn(),
    updateEventType: jest.fn(),
    deleteEventType: jest.fn(),
    getEventTypeStats: jest.fn(),
    getPredefinedColors: jest.fn(),
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

import { EventTypeController } from '../../../controllers/eventType.controller';
import eventTypeService from '../../../services/eventType.service';

const ctrl = new EventTypeController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('EventTypeController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createEventType', () => {
    it('should throw when no userId', async () => {
      const req = { body: { name: 'Test' }, user: undefined } as any;
      await expect(ctrl.createEventType(req, mockRes())).rejects.toThrow();
    });

    it('should throw badRequest when no name', async () => {
      const req = { body: {}, user: { id: 'u1' } } as any;
      await expect(ctrl.createEventType(req, mockRes())).rejects.toThrow('required');
    });

    it('should create with all fields', async () => {
      (eventTypeService.createEventType as jest.Mock).mockResolvedValue({ id: '1', name: 'Wedding' });
      const req = { body: { name: 'Wedding', description: 'desc', color: '#fff', isActive: true }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.createEventType(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create with only name', async () => {
      (eventTypeService.createEventType as jest.Mock).mockResolvedValue({ id: '1', name: 'Party' });
      const req = { body: { name: 'Party' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.createEventType(req, res);
      expect(eventTypeService.createEventType).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Party' }), 'u1'
      );
    });
  });

  describe('getEventTypes', () => {
    it('should pass activeOnly=true when isActive=true', async () => {
      (eventTypeService.getEventTypes as jest.Mock).mockResolvedValue([]);
      const req = { query: { isActive: 'true' } } as any;
      await ctrl.getEventTypes(req, mockRes());
      expect(eventTypeService.getEventTypes).toHaveBeenCalledWith(true);
    });

    it('should pass activeOnly=false when isActive not set', async () => {
      (eventTypeService.getEventTypes as jest.Mock).mockResolvedValue([{ id: '1' }]);
      const req = { query: {} } as any;
      const res = mockRes();
      await ctrl.getEventTypes(req, res);
      expect(eventTypeService.getEventTypes).toHaveBeenCalledWith(false);
    });

    it('should pass activeOnly=false when isActive=false', async () => {
      (eventTypeService.getEventTypes as jest.Mock).mockResolvedValue([]);
      const req = { query: { isActive: 'false' } } as any;
      await ctrl.getEventTypes(req, mockRes());
      expect(eventTypeService.getEventTypes).toHaveBeenCalledWith(false);
    });
  });

  describe('getEventTypeById', () => {
    it('should throw notFound when null', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      await expect(ctrl.getEventTypeById(req, mockRes())).rejects.toThrow('not found');
    });

    it('should return eventType when found', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue({ id: '1', name: 'A' });
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await ctrl.getEventTypeById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateEventType', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, body: {}, user: undefined } as any;
      await expect(ctrl.updateEventType(req, mockRes())).rejects.toThrow();
    });

    it('should include only name when only name provided', async () => {
      (eventTypeService.updateEventType as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' }, body: { name: 'New' }, user: { id: 'u1' } } as any;
      await ctrl.updateEventType(req, mockRes());
      expect(eventTypeService.updateEventType).toHaveBeenCalledWith('1', { name: 'New' }, 'u1');
    });

    it('should include all fields when all provided', async () => {
      (eventTypeService.updateEventType as jest.Mock).mockResolvedValue({ id: '1' });
      const req = {
        params: { id: '1' },
        body: { name: 'A', description: 'B', color: '#000', isActive: false },
        user: { id: 'u1' }
      } as any;
      await ctrl.updateEventType(req, mockRes());
      expect(eventTypeService.updateEventType).toHaveBeenCalledWith(
        '1', { name: 'A', description: 'B', color: '#000', isActive: false }, 'u1'
      );
    });

    it('should send empty data when no fields', async () => {
      (eventTypeService.updateEventType as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' }, body: {}, user: { id: 'u1' } } as any;
      await ctrl.updateEventType(req, mockRes());
      expect(eventTypeService.updateEventType).toHaveBeenCalledWith('1', {}, 'u1');
    });

    it('should include only description and color', async () => {
      (eventTypeService.updateEventType as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' }, body: { description: 'X', color: '#fff' }, user: { id: 'u1' } } as any;
      await ctrl.updateEventType(req, mockRes());
      expect(eventTypeService.updateEventType).toHaveBeenCalledWith('1', { description: 'X', color: '#fff' }, 'u1');
    });
  });

  describe('deleteEventType', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, user: undefined } as any;
      await expect(ctrl.deleteEventType(req, mockRes())).rejects.toThrow();
    });

    it('should delete successfully', async () => {
      (eventTypeService.deleteEventType as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.deleteEventType(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getEventTypeStats', () => {
    it('should return stats', async () => {
      (eventTypeService.getEventTypeStats as jest.Mock).mockResolvedValue([{ type: 'A', count: 5 }]);
      const req = {} as any;
      const res = mockRes();
      await ctrl.getEventTypeStats(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPredefinedColors', () => {
    it('should return colors', async () => {
      (eventTypeService.getPredefinedColors as jest.Mock).mockReturnValue(['#f00', '#0f0']);
      const req = {} as any;
      const res = mockRes();
      await ctrl.getPredefinedColors(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
