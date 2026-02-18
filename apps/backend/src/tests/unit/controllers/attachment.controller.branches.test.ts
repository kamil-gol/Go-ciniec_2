/**
 * AttachmentController — Branch coverage: error paths (next(error)) + archive method
 * Covers: upload error (ln 42), getByEntity error (ln 75) + CLIENT entityType skip,
 * download error (ln 93), update error (ln 111), delete error,
 * archive success+error (ln 128-145), check error (ln 169),
 * batchCheckRodo error (ln 189), batchCheckContract error (ln 209)
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

describe('AttachmentController — error branches', () => {
  it('upload — calls next(error) on service failure', async () => {
    svc.createAttachment.mockRejectedValue(new Error('disk full'));
    const response = res();
    await attachmentController.upload(
      req({
        file: { originalname: 'test.pdf' },
        body: { entityType: 'RESERVATION', entityId: 'r-1', category: 'CONTRACT' },
      }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(response.status).not.toHaveBeenCalled();
  });

  it('getByEntity — calls next(error) on service failure', async () => {
    svc.getAttachments.mockRejectedValue(new Error('DB error'));
    const response = res();
    await attachmentController.getByEntity(
      req({ query: { entityType: 'RESERVATION', entityId: 'r-1' } }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('getByEntity — withClientRodo=true and entityType=CLIENT skips cross-reference', async () => {
    svc.getAttachments.mockResolvedValue([{ id: 'a-1' }]);
    const response = res();
    await attachmentController.getByEntity(
      req({ query: { entityType: 'CLIENT', entityId: 'c-1', withClientRodo: 'true' } }), response, next
    );
    expect(svc.getAttachments).toHaveBeenCalled();
    expect(svc.getAttachmentsWithClientRodo).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'a-1' }] }));
  });

  it('download — calls next(error) on service failure', async () => {
    svc.getFilePath.mockRejectedValue(new Error('file not found'));
    const response = res();
    await attachmentController.download(req({ params: { id: 'a-1' } }), response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('update — calls next(error) on service failure', async () => {
    svc.updateAttachment.mockRejectedValue(new Error('not found'));
    const response = res();
    await attachmentController.update(
      req({ params: { id: 'a-1' }, body: { label: 'X' } }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('delete — calls next(error) on service failure', async () => {
    svc.deleteAttachment.mockRejectedValue(new Error('fail'));
    const response = res();
    await attachmentController.delete(req({ params: { id: 'a-1' } }), response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  describe('archive()', () => {
    it('should return archived attachment on success', async () => {
      svc.deleteAttachment.mockResolvedValue({ id: 'a-1', archived: true });
      const response = res();
      await attachmentController.archive(req({ params: { id: 'a-1' } }), response, next);
      expect(svc.deleteAttachment).toHaveBeenCalledWith('a-1', 'user-1');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: 'a-1' }) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) on failure', async () => {
      svc.deleteAttachment.mockRejectedValue(new Error('archive fail'));
      const response = res();
      await attachmentController.archive(req({ params: { id: 'a-1' } }), response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('check — calls next(error) on service failure', async () => {
    svc.hasAttachment.mockRejectedValue(new Error('check fail'));
    const response = res();
    await attachmentController.check(
      req({ query: { entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' } }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('batchCheckRodo — calls next(error) on service failure', async () => {
    svc.batchCheckRodo.mockRejectedValue(new Error('batch fail'));
    const response = res();
    await attachmentController.batchCheckRodo(
      req({ body: { clientIds: ['c-1'] } }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('batchCheckContract — calls next(error) on service failure', async () => {
    svc.batchCheckContract.mockRejectedValue(new Error('batch contract fail'));
    const response = res();
    await attachmentController.batchCheckContract(
      req({ body: { reservationIds: ['r-1'] } }), response, next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
