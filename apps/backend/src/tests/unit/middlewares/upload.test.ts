/**
 * Upload middleware tests
 * Covers: multer configuration, file filter, size limits
 */

import type { Request } from 'express';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB = 26214400 bytes

let capturedMulterOpts: any;
const mockMulter = jest.fn((opts) => {
  capturedMulterOpts = opts;
  return {
    single: jest.fn(() => jest.fn()),
    array: jest.fn(() => jest.fn()),
  };
});

jest.mock('multer', () => mockMulter);

const fsMock = {
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
};

jest.mock('fs', () => fsMock);

function loadUpload(mockFs = fsMock) {
  jest.resetModules();
  jest.doMock('fs', () => mockFs);
  jest.doMock('multer', () => mockMulter);
  return require('../../../middlewares/upload');
}

describe('upload middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMulterOpts = undefined;
  });

  describe('multer config', () => {
    it('should use disk storage with uploads directory', () => {
      loadUpload();

      expect(capturedMulterOpts.storage).toBeDefined();
    });

    it('should set fileSize limit to MAX_FILE_SIZE', () => {
      loadUpload(fsMock);

      expect(capturedMulterOpts.limits.fileSize).toBe(26214400);
      expect(capturedMulterOpts.limits.files).toBe(1);
    });
  });

  describe('fileFilter', () => {
    it('should accept PDF files', () => {
      loadUpload();

      const callback = jest.fn();
      const req = {} as Request;
      const file = { mimetype: 'application/pdf', originalname: 'test.pdf' } as any;

      capturedMulterOpts.fileFilter(req, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should accept image files', () => {
      loadUpload();

      const callback = jest.fn();
      const req = {} as Request;
      const file = { mimetype: 'image/jpeg', originalname: 'photo.jpg' } as any;

      capturedMulterOpts.fileFilter(req, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-allowed file types', () => {
      loadUpload();

      const callback = jest.fn();
      const req = {} as Request;
      const file = { mimetype: 'application/exe', originalname: 'virus.exe' } as any;

      capturedMulterOpts.fileFilter(req, file, callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
