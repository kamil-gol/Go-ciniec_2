/**
 * EventTypeController — Branch Coverage Tests
 * Tests: validation branches, error handling
 */

jest.mock('../../../services/eventType.service', () => ({
  __esModule: true,
  default: {
    createEventType: jest.fn(),
    getEventTypeById: jest.fn(),
    updateEventType: jest.fn(),
    deleteEventType: jest.fn(),
  },
}));

import { EventTypeController } from '../../../controllers/eventType.controller';
import eventTypeService from '../../../services/eventType.service';

const ctrl = new EventTypeController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EventTypeController branches', () => {
  describe('createEventType', () => {
    it('should create with all fields', async () => {
      (eventTypeService.createEventType as jest.Mock).mockResolvedValue({ id: '1', name: 'Wedding' });
      const req = {
        body: {
          name: 'Wedding',
          description: 'Wedding event',
          color: '#FF0000',
          isActive: true,
          standardHours: 5,
          extraHourRate: 100,
        },
        user: { id: 'u1' },
      } as any;
      const res = mockRes();
      await ctrl.createEventType(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getEventTypeById', () => {
    it('should throw notFound when null', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      const res = mockRes();
      await expect(ctrl.getEventTypeById(req, res, mockNext)).rejects.toThrow(/Nie znaleziono|not found/i);
    });

    it('should return eventType when found', async () => {
      (eventTypeService.getEventTypeById as jest.Mock).mockResolvedValue({ id: '1', name: 'Wedding' });
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await ctrl.getEventTypeById(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
