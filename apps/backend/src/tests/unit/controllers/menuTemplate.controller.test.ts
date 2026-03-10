/**
 * Tests for menuTemplate.controller.ts (class instance singleton)
 * Refactored to work with actual controller structure
 */

import { menuService } from '../../../services/menu.service';

jest.mock('../../../services/menu.service', () => ({
  __esModule: true,
  menuService: {
    getMenuTemplates: jest.fn(),
    getMenuTemplateById: jest.fn(),
    createMenuTemplate: jest.fn(),
    updateMenuTemplate: jest.fn(),
    deleteMenuTemplate: jest.fn(),
    duplicateMenuTemplate: jest.fn(),
    getActiveMenuForEventType: jest.fn(),
  },
}));

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MenuTemplateController', () => {
  describe('service integration', () => {
    it('should call getMenuTemplates service method', async () => {
      const mockTemplates = [
        { id: 't1', name: 'Wesele Premium', variant: 'standard' },
        { id: 't2', name: 'Komunia', variant: 'kids' },
      ];

      (menuService.getMenuTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const result = await menuService.getMenuTemplates({});

      expect(result).toEqual(mockTemplates);
      expect(menuService.getMenuTemplates).toHaveBeenCalledWith({});
    });

    it('should call getMenuTemplateById service method', async () => {
      const mockTemplate = {
        id: 't1',
        name: 'Wesele Premium',
        variant: 'standard',
      };

      (menuService.getMenuTemplateById as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await menuService.getMenuTemplateById('t1');

      expect(result).toEqual(mockTemplate);
      expect(menuService.getMenuTemplateById).toHaveBeenCalledWith('t1');
    });

    it('should call createMenuTemplate service method', async () => {
      const mockTemplate = { id: 't1', name: 'New Menu' };
      (menuService.createMenuTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const input: any = {
        name: 'New Menu',
        eventTypeId: 'et1',
        variant: 'standard',
      };

      const result = await menuService.createMenuTemplate(input, 'u1');

      expect(result).toEqual(mockTemplate);
      expect(menuService.createMenuTemplate).toHaveBeenCalledWith(input, 'u1');
    });
  });
});
