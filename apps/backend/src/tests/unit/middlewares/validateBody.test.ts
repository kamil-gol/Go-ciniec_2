/**
 * validateBody middleware — Unit Tests
 *
 * Covers: success path (body replacement + next), validation failure (400 + errors list)
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../../middlewares/validateBody';

// ─── Helpers ─────────────────────────────────────────────
const mockReq = (body: any = {}): Partial<Request> => ({ body });

const mockRes = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r as Response;
};

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────
describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    age: z.number().min(0, 'Wiek musi byc >= 0'),
  });

  describe('valid body', () => {
    it('should call next() and replace req.body with parsed data', () => {
      const req = mockReq({ name: 'Jan', age: 25 });
      const res = mockRes();
      const middleware = validateBody(schema);

      middleware(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: 'Jan', age: 25 });
    });

    it('should strip unknown fields from body', () => {
      const req = mockReq({ name: 'Jan', age: 30, unknown: 'field' });
      const res = mockRes();
      const middleware = validateBody(schema);

      middleware(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'Jan', age: 30 });
      expect(req.body.unknown).toBeUndefined();
    });
  });

  describe('invalid body', () => {
    it('should return 400 with error details when body is empty', () => {
      const req = mockReq({});
      const response = mockRes();
      const middleware = validateBody(schema);

      middleware(req as Request, response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
          ]),
        })
      );
    });

    it('should return field path in error details', () => {
      const req = mockReq({ name: '', age: -1 });
      const response = mockRes();
      const middleware = validateBody(schema);

      middleware(req as Request, response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      const jsonCall = (response.json as jest.Mock).mock.calls[0][0];
      const fields = jsonCall.details.map((d: any) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['name']));
    });

    it('should return 400 when wrong type provided', () => {
      const req = mockReq({ name: 123, age: 'not-a-number' });
      const response = mockRes();
      const middleware = validateBody(schema);

      middleware(req as Request, response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(400);
    });
  });

  describe('nested schema', () => {
    const nestedSchema = z.object({
      address: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
      }),
    });

    it('should validate nested objects and return dotted field paths', () => {
      const req = mockReq({ address: { street: '', city: '' } });
      const response = mockRes();
      const middleware = validateBody(nestedSchema);

      middleware(req as Request, response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      const jsonCall = (response.json as jest.Mock).mock.calls[0][0];
      const fields = jsonCall.details.map((d: any) => d.field);
      expect(fields).toContain('address.street');
      expect(fields).toContain('address.city');
    });

    it('should pass valid nested object', () => {
      const req = mockReq({ address: { street: 'ul. Testowa 1', city: 'Warszawa' } });
      const response = mockRes();
      const middleware = validateBody(nestedSchema);

      middleware(req as Request, response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
