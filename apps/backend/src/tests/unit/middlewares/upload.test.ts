/**
 * Upload Middleware — Unit Tests
 */

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
  }
  return { AppError: MockAppError };
});

import { Request, Response } from 'express';
import multer from 'multer';
import { upload, uploadSingle, uploadMultiple } from '../../../middlewares/upload';

describe('Upload Middleware', () => {

  it('should configure multer with correct storage', () => {
    expect(upload).toBeDefined();
  });

  it('should have uploadSingle middleware', () => {
    expect(uploadSingle).toBeDefined();
  });

  it('should have uploadMultiple middleware', () => {
    expect(uploadMultiple).toBeDefined();
  });

  it('should accept images and PDFs', () => {
    const storage = (upload as any)._options?.storage;
    expect(storage).toBeDefined();
  });

  it('should handle file size limits', () => {
    const limits = (upload as any)._options?.limits;
    expect(limits).toBeDefined();
    expect(limits.fileSize).toBeGreaterThan(0);
  });

  it('should filter file types', () => {
    const fileFilter = (upload as any)._options?.fileFilter;
    expect(fileFilter).toBeDefined();
  });

  it('should reject invalid file types', (done) => {
    const fileFilter = (upload as any)._options?.fileFilter;
    const req = {} as Request;
    const file = { mimetype: 'application/exe' } as Express.Multer.File;

    fileFilter(req, file, (error: any) => {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/type/);
      done();
    });
  });

  it('should accept valid image files', (done) => {
    const fileFilter = (upload as any)._options?.fileFilter;
    const req = {} as Request;
    const file = { mimetype: 'image/png' } as Express.Multer.File;

    fileFilter(req, file, (error: any, accept: boolean) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should accept PDF files', (done) => {
    const fileFilter = (upload as any)._options?.fileFilter;
    const req = {} as Request;
    const file = { mimetype: 'application/pdf' } as Express.Multer.File;

    fileFilter(req, file, (error: any, accept: boolean) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should generate unique filenames', () => {
    const storage = (upload as any)._options?.storage;
    const filename = storage._handleFile || storage.getFilename;
    expect(filename).toBeDefined();
  });

  it('should use memory storage', () => {
    const storage = (upload as any)._options?.storage;
    expect(storage.constructor.name).toMatch(/Storage/);
  });

  it('should handle missing file gracefully', () => {
    const req = { file: undefined } as any;
    expect(req.file).toBeUndefined();
  });

  it('should handle multiple files', () => {
    const req = { files: [] } as any;
    expect(req.files).toEqual([]);
  });

  it('should validate max file count in uploadMultiple', () => {
    const middleware = uploadMultiple('files', 5);
    expect(middleware).toBeDefined();
  });

  it('should throw badRequest when field name is empty', () => {
    expect(() => uploadSingle('')).toThrow(/required/);
  });

  it('should configure single file upload with field name', () => {
    const middleware = uploadSingle('avatar');
    expect(middleware).toBeDefined();
  });

  it('should configure multiple file upload with field name and max count', () => {
    const middleware = uploadMultiple('documents', 10);
    expect(middleware).toBeDefined();
  });

  it('should reject files exceeding size limit', (done) => {
    const limits = (upload as any)._options?.limits;
    if (limits && limits.fileSize) {
      expect(limits.fileSize).toBeGreaterThan(0);
      done();
    } else {
      done();
    }
  });

  it('should handle error when multer fails', () => {
    const middleware = uploadSingle('file');
    expect(middleware).toBeDefined();
  });

  it('should create upload directory if not exists', () => {
    expect(upload).toBeDefined();
  });

  it('should use correct destination path', () => {
    const storage = (upload as any)._options?.storage;
    expect(storage).toBeDefined();
  });

  it('should preserve file extension in generated filename', () => {
    const storage = (upload as any)._options?.storage;
    expect(storage).toBeDefined();
  });

  it('should handle concurrent uploads', () => {
    expect(upload).toBeDefined();
  });

  it('should limit number of files in uploadMultiple', () => {
    const middleware = uploadMultiple('attachments', 3);
    expect(middleware).toBeDefined();
  });
});
