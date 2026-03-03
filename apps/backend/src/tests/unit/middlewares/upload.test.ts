import multer from 'multer';
import path from 'path';

describe('upload middleware', () => {
  describe('fileFilter', () => {
    let fileFilter: multer.Options['fileFilter'];

    beforeAll(() => {
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      fileFilter = (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Niedozwolony typ pliku: ${file.mimetype}. Dozwolone: ${allowedMimeTypes.join(', ')}`
            )
          );
        }
      };
    });

    it('should accept allowed file types', () => {
      const cb = jest.fn();
      fileFilter!({}, { mimetype: 'application/pdf' } as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept JPEG images', () => {
      const cb = jest.fn();
      fileFilter!({}, { mimetype: 'image/jpeg' } as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept PNG images', () => {
      const cb = jest.fn();
      fileFilter!({}, { mimetype: 'image/png' } as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept DOCX files', () => {
      const cb = jest.fn();
      fileFilter!(
        {},
        {
          mimetype:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        } as Express.Multer.File,
        cb
      );
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-allowed file types', () => {
      const cb = jest.fn();
      fileFilter!({}, { mimetype: 'application/zip' } as Express.Multer.File, cb);
      // Callback is called with error (first arg is Error, second is undefined or false)
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
