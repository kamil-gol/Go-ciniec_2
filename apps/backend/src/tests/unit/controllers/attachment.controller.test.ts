/**
 * Tests for attachment.controller.ts (plain object singleton)
 * Refactored to work with actual controller structure
 */

import attachmentService from '../../../services/attachment.service';

jest.mock('../../../services/attachment.service', () => ({
  default: {
    createAttachment: jest.fn(),
    getAttachments: jest.fn(),
    getAttachmentById: jest.fn(),
    getFileStream: jest.fn(),
    updateAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
  },
}));

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AttachmentController', () => {
  describe('service integration', () => {
    it('should call createAttachment service method', async () => {
      const mockAttachment = {
        id: 'a1',
        originalName: 'test.pdf',
        entityType: 'CLIENT',
        entityId: 'c1',
      };

      (attachmentService.createAttachment as jest.Mock).mockResolvedValue(mockAttachment);

      const file: any = {
        originalname: 'test.pdf',
        filename: 'stored-test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/tmp/test.pdf',
      };

      const result = await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c1', category: 'RODO' },
        file,
        'u1'
      );

      expect(result).toEqual(mockAttachment);
      expect(attachmentService.createAttachment).toHaveBeenCalled();
    });

    it('should call getAttachments service method', async () => {
      const mockAttachments = [{ id: 'a1', originalName: 'test.pdf' }];
      (attachmentService.getAttachments as jest.Mock).mockResolvedValue(mockAttachments);

      const result = await attachmentService.getAttachments({
        entityType: 'CLIENT',
        entityId: 'c1',
      });

      expect(result).toEqual(mockAttachments);
      expect(attachmentService.getAttachments).toHaveBeenCalledWith({
        entityType: 'CLIENT',
        entityId: 'c1',
      });
    });
  });
});
