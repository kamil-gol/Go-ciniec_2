/**
 * Upload Middleware — Unit Tests
 * Tests: multer configuration, file filter logic
 */

jest.mock('multer', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => next()),
    array: jest.fn(() => (req: any, res: any, next: any) => next()),
  })),
  diskStorage: jest.fn((config) => config),
}));

import multer from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

// Load upload module to test configuration
function loadUpload() {
  jest.isolateModules(() => {
    require('../../../middlewares/upload');
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('upload middleware', () => {
  describe('multer config', () => {
    it('should use disk storage with uploads directory', () => {
      loadUpload();
      expect(multer.diskStorage).toHaveBeenCalled();
    });

    it('should set fileSize limit to MAX_FILE_SIZE', () => {
      loadUpload();
      expect(multer).toHaveBeenCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            fileSize: MAX_FILE_SIZE,
          }),
        })
      );
    });
  });

  describe('fileFilter', () => {
    it('should accept PDF files', () => {
      loadUpload();
      const call = (multer as jest.Mock).mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept image files', () => {
      loadUpload();
      const call = (multer as jest.Mock).mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-allowed file types', () => {
      loadUpload();
      const call = (multer as jest.Mock).mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/zip' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
