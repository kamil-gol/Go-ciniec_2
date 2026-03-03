/**
 * Upload Middleware — Unit Tests
 * Tests: multer configuration, file filter logic
 */

const mockDiskStorage = jest.fn((config) => config);
const mockSingle = jest.fn();
const mockArray = jest.fn();
const mockMulter = jest.fn(() => ({
  single: mockSingle,
  array: mockArray,
}));
mockMulter.diskStorage = mockDiskStorage;

jest.mock('multer', () => ({
  __esModule: true,
  default: mockMulter,
}));

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

beforeEach(() => {
  jest.clearAllMocks();
});

describe('upload middleware', () => {
  describe('multer config', () => {
    it('should use disk storage with uploads directory', () => {
      require('../../../middlewares/upload');
      expect(mockDiskStorage).toHaveBeenCalled();
    });

    it('should set fileSize limit to MAX_FILE_SIZE', () => {
      require('../../../middlewares/upload');
      expect(mockMulter).toHaveBeenCalledWith(
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
      require('../../../middlewares/upload');
      const call = mockMulter.mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept image files', () => {
      require('../../../middlewares/upload');
      const call = mockMulter.mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-allowed file types', () => {
      require('../../../middlewares/upload');
      const call = mockMulter.mock.calls[0][0];
      const fileFilter = call.fileFilter;
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/zip' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
