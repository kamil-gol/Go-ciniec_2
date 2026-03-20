/**
 * SearchController — Unit Tests
 * Tests validation logic and response formatting.
 * Service layer is fully mocked.
 */

jest.mock('../../../services/search.service', () => ({
  __esModule: true,
  default: {
    globalSearch: jest.fn(),
  },
}));

import { SearchController } from '../../../controllers/search.controller';
import searchService from '../../../services/search.service';

const controller = new SearchController();
const svc = searchService as any;

const req = (overrides: any = {}): any => ({
  query: {},
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('SearchController', () => {
  describe('globalSearch()', () => {
    it('should throw 400 when query is missing', async () => {
      await expect(controller.globalSearch(req({ query: {} }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when query is too short (1 char)', async () => {
      await expect(controller.globalSearch(req({ query: { q: 'a' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when query is whitespace only', async () => {
      await expect(controller.globalSearch(req({ query: { q: '  ' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should call searchService.globalSearch with query and default limit', async () => {
      const mockResults = {
        reservations: [{ id: 'r1' }],
        clients: [{ id: 'c1' }],
        halls: [],
      };
      svc.globalSearch.mockResolvedValue(mockResults);

      const r = res();
      await controller.globalSearch(req({ query: { q: 'Kowalski' } }), r);

      expect(svc.globalSearch).toHaveBeenCalledWith('Kowalski', 5);
      expect(r.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults,
      });
    });

    it('should respect custom limit parameter', async () => {
      svc.globalSearch.mockResolvedValue({ reservations: [], clients: [], halls: [] });

      const r = res();
      await controller.globalSearch(req({ query: { q: 'test', limit: '10' } }), r);

      expect(svc.globalSearch).toHaveBeenCalledWith('test', 10);
    });

    it('should cap limit at 20', async () => {
      svc.globalSearch.mockResolvedValue({ reservations: [], clients: [], halls: [] });

      const r = res();
      await controller.globalSearch(req({ query: { q: 'test', limit: '100' } }), r);

      expect(svc.globalSearch).toHaveBeenCalledWith('test', 20);
    });

    it('should accept 2-character query', async () => {
      svc.globalSearch.mockResolvedValue({ reservations: [], clients: [], halls: [] });

      const r = res();
      await controller.globalSearch(req({ query: { q: 'ab' } }), r);

      expect(svc.globalSearch).toHaveBeenCalledWith('ab', 5);
    });
  });
});
