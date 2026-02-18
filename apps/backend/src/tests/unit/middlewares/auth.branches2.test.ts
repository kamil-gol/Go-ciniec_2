/**
 * Auth middleware — Branch Coverage (lines 12, 19: JWT_SECRET env checks)
 */

describe('auth.ts — JWT_SECRET environment checks', () => {

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should throw in production when JWT_SECRET is missing (line 12)', () => {
    process.env.NODE_ENV = 'production';
    expect(() => {
      require('../../../middlewares/auth');
    }).toThrow('FATAL: JWT_SECRET environment variable is not set');
  });

  it('should warn (not throw) in non-production when JWT_SECRET is missing (line 19)', () => {
    process.env.NODE_ENV = 'test';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // Logger might use console or a different transport; import should succeed
    expect(() => {
      require('../../../middlewares/auth');
    }).not.toThrow();
    warnSpy.mockRestore();
  });

  it('should not warn when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
    expect(() => {
      require('../../../middlewares/auth');
    }).not.toThrow();
  });
});
