/**
 * Attachment Controller — Unit Tests
 */

jest.mock('../../../services/attachment.service', () => ({
  __esModule: true,
  default: {
    createAttachment: jest.fn(),
    getAttachments: jest.fn(),
    getAttachmentById: jest.fn(),
    updateAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    downloadAttachment: jest.fn(),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { AttachmentController } from '../../../controllers/attachment.controller';
import attachmentService from '../../../services/attachment.service';

const ctrl = new AttachmentController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('AttachmentController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create attachment', async () => {
    (attachmentService.createAttachment as jest.Mock).mockResolvedValue({ id: '1' });
    const req = {
      body: { reservationId: 'r1', categoryId: 'c1', filename: 'doc.pdf' },
      user: { id: 'u1' }
    } as any;
    const res = mockRes();
    await ctrl.createAttachment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should get attachments', async () => {
    (attachmentService.getAttachments as jest.Mock).mockResolvedValue([{ id: '1' }]);
    const req = { query: {} } as any;
    const res = mockRes();
    await ctrl.getAttachments(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get attachment by id', async () => {
    (attachmentService.getAttachmentById as jest.Mock).mockResolvedValue({ id: '1' });
    const req = { params: { id: '1' } } as any;
    const res = mockRes();
    await ctrl.getAttachmentById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should update attachment', async () => {
    (attachmentService.updateAttachment as jest.Mock).mockResolvedValue({ id: '1' });
    const req = { params: { id: '1' }, body: { filename: 'new.pdf' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.updateAttachment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete attachment', async () => {
    (attachmentService.deleteAttachment as jest.Mock).mockResolvedValue(undefined);
    const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.deleteAttachment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should download attachment', async () => {
    (attachmentService.downloadAttachment as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('test'),
      filename: 'doc.pdf',
      mimeType: 'application/pdf'
    });
    const req = { params: { id: '1' } } as any;
    const res = mockRes();
    await ctrl.downloadAttachment(req, res);
    expect(res.setHeader).toHaveBeenCalled();
  });

  it('should throw notFound when attachment not found (coverage line ~111)', async () => {
    (attachmentService.getAttachmentById as jest.Mock).mockResolvedValue(null);
    const req = { params: { id: 'x' } } as any;
    await expect(ctrl.getAttachmentById(req, mockRes())).rejects.toThrow(/not found/);
  });
});
