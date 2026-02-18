/**
 * AttachmentController — Unit Tests
 * Uses try/catch + next pattern.
 */
jest.mock('../../../services/attachment.service', () => ({
  __esModule: true,
  default: {
    createAttachment: jest.fn(),
    getAttachments: jest.fn(),
    getAttachmentsWithClientRodo: jest.fn(),
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

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  file: undefined,
  user: { id: 'user-1' },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.sendFile = jest.fn();
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('AttachmentController', () => {
  describe('upload()', () => {
    it('should return 400 when no file', async () => {
      const response = res();
      await attachmentController.upload(req(), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 when no user', async () => {
      const response = res();
      await attachmentController.upload(
        req({ file: { originalname: 'test.pdf' }, user: undefined }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(401);
    });

    it('should return 201 on success', async () => {
      svc.createAttachment.mockResolvedValue({ id: 'a-1' });
      const response = res();
      await attachmentController.upload(
        req({
          file: { originalname: 'test.pdf' },
          body: { entityType: 'RESERVATION', entityId: 'r-1', category: 'CONTRACT' },
        }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getByEntity()', () => {
    it('should return 400 when missing params', async () => {
      const response = res();
      await attachmentController.getByEntity(req({ query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return attachments', async () => {
      svc.getAttachments.mockResolvedValue([{ id: 'a-1' }]);
      const response = res();
      await attachmentController.getByEntity(
        req({ query: { entityType: 'RESERVATION', entityId: 'r-1' } }), response, next
      );
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'a-1' }] }));
    });

    it('should use withClientRodo method', async () => {
      svc.getAttachmentsWithClientRodo.mockResolvedValue([]);
      const response = res();
      await attachmentController.getByEntity(
        req({ query: { entityType: 'RESERVATION', entityId: 'r-1', withClientRodo: 'true' } }), response, next
      );
      expect(svc.getAttachmentsWithClientRodo).toHaveBeenCalled();
    });
  });

  describe('download()', () => {
    it('should sendFile', async () => {
      svc.getFilePath.mockResolvedValue({
        filePath: '/tmp/test.pdf',
        attachment: { mimeType: 'application/pdf', originalName: 'test.pdf' },
      });
      const response = res();
      await attachmentController.download(req({ params: { id: 'a-1' } }), response, next);
      expect(response.sendFile).toHaveBeenCalledWith('/tmp/test.pdf');
    });
  });

  describe('update()', () => {
    it('should return updated attachment', async () => {
      svc.updateAttachment.mockResolvedValue({ id: 'a-1', label: 'Updated' });
      const response = res();
      await attachmentController.update(
        req({ params: { id: 'a-1' }, body: { label: 'Updated' } }), response, next
      );
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ label: 'Updated' }) }));
    });
  });

  describe('delete()', () => {
    it('should return success message', async () => {
      svc.deleteAttachment.mockResolvedValue(undefined);
      const response = res();
      await attachmentController.delete(req({ params: { id: 'a-1' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('zarchiwizowany') }));
    });
  });

  describe('check()', () => {
    it('should return 400 when missing params', async () => {
      const response = res();
      await attachmentController.check(req({ query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return has=true', async () => {
      svc.hasAttachment.mockResolvedValue(true);
      const response = res();
      await attachmentController.check(
        req({ query: { entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' } }), response, next
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { has: true } })
      );
    });
  });

  describe('batchCheckRodo()', () => {
    it('should return 400 when no clientIds', async () => {
      const response = res();
      await attachmentController.batchCheckRodo(req({ body: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return result', async () => {
      svc.batchCheckRodo.mockResolvedValue({ 'c-1': true });
      const response = res();
      await attachmentController.batchCheckRodo(
        req({ body: { clientIds: ['c-1'] } }), response, next
      );
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: { 'c-1': true } }));
    });
  });

  describe('batchCheckContract()', () => {
    it('should return 400 when no reservationIds', async () => {
      const response = res();
      await attachmentController.batchCheckContract(req({ body: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return result', async () => {
      svc.batchCheckContract.mockResolvedValue({ 'r-1': false });
      const response = res();
      await attachmentController.batchCheckContract(
        req({ body: { reservationIds: ['r-1'] } }), response, next
      );
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: { 'r-1': false } }));
    });
  });
});
