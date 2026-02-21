/**
 * upload.ts middleware tests
 *
 * Strategy:
 * - ensureDirectories() runs at module load → use jest.isolateModules
 * - fileFilter & storage callbacks → capture from multer mock args
 *
 * Path notes:
 * - jest.doMock paths resolve relative to THIS file (src/tests/unit/middlewares/)
 * - logger lives at src/utils/logger.ts → '../../../utils/logger'
 * - upload lives at src/middlewares/upload.ts → '../../../middlewares/upload'
 */

// Shared references for captured multer callbacks
let capturedFileFilter: any;
let capturedStorageOpts: any;
let capturedMulterOpts: any;

function createMulterMock() {
  const fn: any = jest.fn((opts: any) => {
    capturedMulterOpts = opts;
    capturedFileFilter = opts.fileFilter;
    return { single: jest.fn() };
  });
  fn.diskStorage = jest.fn((opts: any) => {
    capturedStorageOpts = opts;
    return {};
  });
  return { __esModule: true, default: fn };
}

function createLoggerMock() {
  return {
    __esModule: true,
    default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  };
}

function loadUpload(fsMock: any, loggerFactory?: () => any) {
  const logger = loggerFactory ? loggerFactory() : createLoggerMock();

  jest.isolateModules(() => {
    jest.doMock('fs', () => fsMock);
    jest.doMock('../../../utils/logger', () => logger);
    jest.doMock('multer', () => createMulterMock());
    jest.doMock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

    require('../../../middlewares/upload');
  });

  return logger;
}

describe('upload middleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    capturedFileFilter = null;
    capturedStorageOpts = null;
    capturedMulterOpts = null;
  });

  describe('ensureDirectories — dirs DO NOT exist', () => {
    it('should create staging + entity directories', () => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(false), mkdirSync: jest.fn() };
      const logger = loadUpload(fsMock);

      expect(fsMock.existsSync).toHaveBeenCalled();
      expect(fsMock.mkdirSync.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(logger.default.info).toHaveBeenCalled();
    });
  });

  describe('ensureDirectories — dirs ALREADY exist', () => {
    it('should not create directories', () => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn() };
      loadUpload(fsMock);

      expect(fsMock.existsSync).toHaveBeenCalled();
      expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('ensureDirectories — mixed (some exist, some not)', () => {
    it('should only create missing directories', () => {
      let callCount = 0;
      const fsMock = {
        existsSync: jest.fn(() => {
          callCount++;
          return callCount > 1;
        }),
        mkdirSync: jest.fn(),
      };
      loadUpload(fsMock);

      expect(fsMock.mkdirSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('fileFilter', () => {
    beforeEach(() => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn() };
      loadUpload(fsMock);
    });

    it('should accept application/pdf', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept image/jpeg', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept image/png', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept image/webp', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject text/plain', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'text/plain' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject application/zip', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'application/zip' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should include rejected mimetype in error message', () => {
      const cb = jest.fn();
      capturedFileFilter({}, { mimetype: 'video/mp4' }, cb);
      const error = cb.mock.calls[0][0] as Error;
      expect(error.message).toContain('video/mp4');
      expect(error.message).toContain('Niedozwolony typ pliku');
    });
  });

  describe('storage callbacks', () => {
    beforeEach(() => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn() };
      loadUpload(fsMock);
    });

    it('destination should point to staging dir', () => {
      const cb = jest.fn();
      capturedStorageOpts.destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('_staging'));
    });

    it('filename should use uuid + original extension', () => {
      const cb = jest.fn();
      capturedStorageOpts.filename({}, { originalname: 'photo.JPG' }, cb);
      expect(cb).toHaveBeenCalledWith(null, 'test-uuid-1234.jpg');
    });

    it('filename should handle files without extension', () => {
      const cb = jest.fn();
      capturedStorageOpts.filename({}, { originalname: 'noext' }, cb);
      expect(cb).toHaveBeenCalledWith(null, 'test-uuid-1234');
    });
  });

  describe('multer config', () => {
    it('should set fileSize limit to MAX_FILE_SIZE', () => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn() };
      loadUpload(fsMock);

      expect(capturedMulterOpts.limits.fileSize).toBe(10 * 1024 * 1024);
      expect(capturedMulterOpts.limits.files).toBe(1);
    });
  });

  describe('exports', () => {
    it('should export UPLOAD_BASE as absolute path containing uploads', () => {
      const fsMock = { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn() };
      let mod: any;

      jest.isolateModules(() => {
        jest.doMock('fs', () => fsMock);
        jest.doMock('../../../utils/logger', () => createLoggerMock());
        jest.doMock('multer', () => {
          const fn: any = jest.fn(() => ({ single: jest.fn() }));
          fn.diskStorage = jest.fn(() => ({}));
          return { __esModule: true, default: fn };
        });
        jest.doMock('uuid', () => ({ v4: () => 'x' }));

        mod = require('../../../middlewares/upload');
      });

      expect(mod.UPLOAD_BASE).toBeDefined();
      expect(mod.UPLOAD_BASE).toContain('uploads');
    });
  });
});
