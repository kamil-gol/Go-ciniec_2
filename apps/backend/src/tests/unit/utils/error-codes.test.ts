import { ErrorCode, getStatusForErrorCode } from '../../../utils/error-codes';

describe('ErrorCode', () => {
  describe('getStatusForErrorCode', () => {
    it('should return 400 for VALIDATION errors', () => {
      expect(getStatusForErrorCode(ErrorCode.VALIDATION_FAILED)).toBe(400);
      expect(getStatusForErrorCode(ErrorCode.VALIDATION_GUEST_COUNT)).toBe(400);
    });

    it('should return 404 for NOT_FOUND errors', () => {
      expect(getStatusForErrorCode(ErrorCode.NOT_FOUND_RESERVATION)).toBe(404);
      expect(getStatusForErrorCode(ErrorCode.NOT_FOUND_CLIENT)).toBe(404);
      expect(getStatusForErrorCode(ErrorCode.NOT_FOUND_HALL)).toBe(404);
    });

    it('should return 409 for CONFLICT errors', () => {
      expect(getStatusForErrorCode(ErrorCode.CONFLICT_DUPLICATE)).toBe(409);
      expect(getStatusForErrorCode(ErrorCode.CONFLICT_HALL_BOOKED)).toBe(409);
    });

    it('should return 403 for FORBIDDEN errors', () => {
      expect(getStatusForErrorCode(ErrorCode.FORBIDDEN_ROLE)).toBe(403);
    });

    it('should return 401 for AUTH errors', () => {
      expect(getStatusForErrorCode(ErrorCode.AUTH_TOKEN_EXPIRED)).toBe(401);
      expect(getStatusForErrorCode(ErrorCode.AUTH_INVALID_CREDENTIALS)).toBe(401);
    });

    it('should return 500 for INTERNAL errors', () => {
      expect(getStatusForErrorCode(ErrorCode.INTERNAL_SERVER_ERROR)).toBe(500);
    });

    it('should cover all ErrorCode values', () => {
      const allCodes = Object.values(ErrorCode);
      for (const code of allCodes) {
        const status = getStatusForErrorCode(code);
        expect([400, 401, 403, 404, 409, 500]).toContain(status);
      }
    });
  });
});
