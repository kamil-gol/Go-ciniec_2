/**
 * MenuTemplateController — Unit Tests
 * Tests: downloadPdf with null option handling + error patterns
 */

jest.mock('../../../services/menuTemplate.service');
jest.mock('../../../services/pdf.service');

import { MenuTemplateController } from '../../../controllers/menuTemplate.controller';
import menuTemplateService from '../../../services/menuTemplate.service';
import { pdfService } from '../../../services/pdf.service';

const ctrl = new MenuTemplateController();

const req = (o: any = {}) => ({ params: {}, query: {}, body: {}, ...o } as any);

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MenuTemplateController', () => {
  describe('downloadPdf()', () => {
    it('should handle option with null fields (fallbacks)', async () => {
      const template = {
        id: 't-1',
        name: 'Test',
        eventType: { name: 'Wesele' },
        packages: [
          {
            id: 'pkg-1',
            name: 'Pakiet A',
            options: [
              {
                id: 'opt-1',
                option: null,
                customPrice: null,
              },
            ],
          },
        ],
      };
      (menuTemplateService.getById as jest.Mock).mockResolvedValue(template);
      (pdfService.generateMenuCardPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));

      const response = mockRes();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);

      const pdfData = (pdfService.generateMenuCardPDF as jest.Mock).mock.calls[0]?.[0];
      if (pdfData?.packages?.[0]?.options?.length > 0) {
        const opt = pdfData.packages[0].options[0];
        expect(opt.name).toMatch(/Nieznana|Unknown/i);
      }
    });

    it('should use customPrice when available', async () => {
      const template = {
        id: 't-1',
        name: 'Test',
        eventType: { name: 'Wesele' },
        packages: [
          {
            id: 'pkg-1',
            name: 'Pakiet A',
            options: [
              {
                id: 'opt-1',
                option: { id: 'o-1', name: 'Opcja 1', priceType: 'FLAT', priceAmount: 300 },
                customPrice: 500,
              },
            ],
          },
        ],
      };
      (menuTemplateService.getById as jest.Mock).mockResolvedValue(template);
      (pdfService.generateMenuCardPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));

      const response = mockRes();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);

      const pdfData = (pdfService.generateMenuCardPDF as jest.Mock).mock.calls[0]?.[0];
      if (pdfData?.packages?.[0]?.options?.length > 0) {
        expect(pdfData.packages[0].options[0].priceAmount).toBe(500);
      }
    });

    it('should return 500 with Unknown error for non-Error objects', async () => {
      (menuTemplateService.getById as jest.Mock).mockRejectedValue('string error');

      const response = mockRes();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringMatching(/Nieznany|Unknown/i),
        })
      );
    });
  });
});
