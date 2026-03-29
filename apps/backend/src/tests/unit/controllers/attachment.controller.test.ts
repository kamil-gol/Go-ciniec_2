/**
 * Tests for attachment.controller.ts (plain object singleton)
 * Refactored to work with actual controller structure
 */

jest.mock('../../../services/attachment.service', () => ({
  __esModule: true,
  default: {
    createAttachment: jest.fn(),
    getAttachments: jest.fn(),
    getAttachmentsWithClientRodo: jest.fn(),
    getAttachmentById: jest.fn(),
    getFileStream: jest.fn(),
    getFilePath: jest.fn(),
    updateAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    hasAttachment: jest.fn(),
    batchCheckRodo: jest.fn(),
    batchCheckContract: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import attachmentController from '../../../controllers/attachment.controller';
import attachmentService from '../../../services/attachment.service';

const svc = attachmentService as any;

const mockReq = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  file: undefined,
  user: { id: 'user-1' },
  ...overrides,
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn();
  return res;
};

const next = jest.fn();

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

  describe('edge cases / branch coverage', () => {
    it('upload — calls next(error) on service failure', async () => {
      svc.createAttachment.mockRejectedValue(new Error('disk full'));
      const response = mockRes();
      await attachmentController.upload(
        mockReq({
          file: { originalname: 'test.pdf' },
          body: { entityType: 'RESERVATION', entityId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', category: 'CONTRACT' },
        }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(response.status).not.toHaveBeenCalled();
    });

    it('getByEntity — calls next(error) on service failure', async () => {
      svc.getAttachments.mockRejectedValue(new Error('DB error'));
      const response = mockRes();
      await attachmentController.getByEntity(
        mockReq({ query: { entityType: 'RESERVATION', entityId: 'r-1' } }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('getByEntity — withClientRodo=true and entityType=CLIENT skips cross-reference', async () => {
      svc.getAttachments.mockResolvedValue([{ id: 'a-1' }]);
      const response = mockRes();
      await attachmentController.getByEntity(
        mockReq({ query: { entityType: 'CLIENT', entityId: 'c-1', withClientRodo: 'true' } }), response, next
      );
      expect(svc.getAttachments).toHaveBeenCalled();
      expect(svc.getAttachmentsWithClientRodo).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'a-1' }] }));
    });

    it('download — calls next(error) on service failure', async () => {
      svc.getFilePath.mockRejectedValue(new Error('file not found'));
      const response = mockRes();
      await attachmentController.download(mockReq({ params: { id: 'a-1' } }), response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('update — calls next(error) on service failure', async () => {
      svc.updateAttachment.mockRejectedValue(new Error('not found'));
      const response = mockRes();
      await attachmentController.update(
        mockReq({ params: { id: 'a-1' }, body: { label: 'X' } }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('delete — calls next(error) on service failure', async () => {
      svc.deleteAttachment.mockRejectedValue(new Error('fail'));
      const response = mockRes();
      await attachmentController.delete(mockReq({ params: { id: 'a-1' } }), response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    describe('archive()', () => {
      it('should return archived attachment on success', async () => {
        svc.deleteAttachment.mockResolvedValue({ id: 'a-1', archived: true });
        const response = mockRes();
        await attachmentController.archive(mockReq({ params: { id: 'a-1' } }), response, next);
        expect(svc.deleteAttachment).toHaveBeenCalledWith('a-1', 'user-1');
        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ id: 'a-1' }) })
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('should call next(error) on failure', async () => {
        svc.deleteAttachment.mockRejectedValue(new Error('archive fail'));
        const response = mockRes();
        await attachmentController.archive(mockReq({ params: { id: 'a-1' } }), response, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('check — calls next(error) on service failure', async () => {
      svc.hasAttachment.mockRejectedValue(new Error('check fail'));
      const response = mockRes();
      await attachmentController.check(
        mockReq({ query: { entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' } }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('batchCheckRodo — calls next(error) on service failure', async () => {
      svc.batchCheckRodo.mockRejectedValue(new Error('batch fail'));
      const response = mockRes();
      await attachmentController.batchCheckRodo(
        mockReq({ body: { clientIds: ['c-1'] } }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('batchCheckContract — calls next(error) on service failure', async () => {
      svc.batchCheckContract.mockRejectedValue(new Error('batch contract fail'));
      const response = mockRes();
      await attachmentController.batchCheckContract(
        mockReq({ body: { reservationIds: ['r-1'] } }), response, next
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
