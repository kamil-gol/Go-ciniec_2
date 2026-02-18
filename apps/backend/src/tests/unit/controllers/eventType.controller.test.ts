/**
 * EventTypeController — Unit Tests
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

import { EventTypeController } from '../../../controllers/eventType.controller';
import eventTypeService from '../../../services/eventType.service';

const controller = new EventTypeController();
const svc = eventTypeService as any;

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

describe('EventTypeController', () => {
  describe('createEventType()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.createEventType(
        req({ user: undefined, body: { name: 'Wesele' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when name missing', async () => {
      await expect(controller.createEventType(
        req({ body: {} }), res()
      )).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 201 on success', async () => {
      svc.createEventType.mockResolvedValue({ id: 'et-1', name: 'Wesele' });
      const response = res();
      await controller.createEventType(req({ body: { name: 'Wesele', color: '#FF0000' } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getEventTypes()', () => {
    it('should return types with count', async () => {
      svc.getEventTypes.mockResolvedValue([{ id: 'et-1' }]);
      const response = res();
      await controller.getEventTypes(req({ query: { isActive: 'true' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
      expect(svc.getEventTypes).toHaveBeenCalledWith(true);
    });
  });

  describe('getEventTypeById()', () => {
    it('should return type', async () => {
      svc.getEventTypeById.mockResolvedValue({ id: 'et-1', name: 'Wesele' });
      const response = res();
      await controller.getEventTypeById(req({ params: { id: 'et-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 when not found', async () => {
      svc.getEventTypeById.mockResolvedValue(null);
      await expect(controller.getEventTypeById(req({ params: { id: 'x' } }), res()))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateEventType()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.updateEventType(
        req({ user: undefined, params: { id: 'et-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.updateEventType.mockResolvedValue({ id: 'et-1', name: 'Updated' });
      const response = res();
      await controller.updateEventType(req({ params: { id: 'et-1' }, body: { name: 'Updated' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteEventType()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.deleteEventType(
        req({ user: undefined, params: { id: 'et-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.deleteEventType.mockResolvedValue(undefined);
      const response = res();
      await controller.deleteEventType(req({ params: { id: 'et-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  it('getEventTypeStats — returns stats', async () => {
    svc.getEventTypeStats.mockResolvedValue([{ name: 'Wesele', count: 10 }]);
    const response = res();
    await controller.getEventTypeStats(req(), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    );
  });

  it('getPredefinedColors — returns colors', async () => {
    svc.getPredefinedColors.mockReturnValue(['#FF0000', '#00FF00']);
    const response = res();
    await controller.getPredefinedColors(req(), response);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: ['#FF0000', '#00FF00'] })
    );
  });
});
