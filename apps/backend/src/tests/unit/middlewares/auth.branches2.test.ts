/**
 * Auth middleware — Branch Coverage (lines 12, 19: JWT_SECRET env checks)
 */

describe('auth.ts — JWT_SECRET environment checks', () => {

  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('should throw in production when JWT_SECRET is missing (line 12)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    jest.isolateModules(() => {
      // Mock logger to avoid side effects
      jest.doMock('@utils/logger', () => ({ default: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));
      expect(() => {
        require('../../../middlewares/auth');
      }).toThrow('FATAL');
    });
  });

  it('should warn (not throw) in dev when JWT_SECRET is missing (line 19)', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET;

    jest.isolateModules(() => {
      const mockWarn = jest.fn();
      jest.doMock('@utils/logger', () => ({ default: { warn: mockWarn, error: jest.fn(), info: jest.fn() } }));
      expect(() => {
        require('../../../middlewares/auth');
      }).not.toThrow();
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET is not set'));
    });
  });

  it('should not warn when JWT_SECRET is set', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'my-test-secret';

    jest.isolateModules(() => {
      const mockWarn = jest.fn();
      jest.doMock('@utils/logger', () => ({ default: { warn: mockWarn, error: jest.fn(), info: jest.fn() } }));
      expect(() => {
        require('../../../middlewares/auth');
      }).not.toThrow();
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });
});
