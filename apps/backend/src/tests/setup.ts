// ========================================
// Jest Global Setup
// ========================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/rezerwacje_test';
process.env.PORT = '0'; // Random port for tests
process.env.LOG_LEVEL = 'silent';

// Restaurant env vars for PDF tests
process.env.RESTAURANT_NAME = 'Test Restaurant';
process.env.RESTAURANT_ADDRESS = 'ul. Testowa 1, 00-000 Test';
process.env.RESTAURANT_PHONE = '+48 000 000 000';
process.env.RESTAURANT_EMAIL = 'test@test.pl';
process.env.RESTAURANT_WEBSITE = 'www.test.pl';
process.env.RESTAURANT_NIP = '000-000-00-00';

// Suppress console logs during tests
jest.mock('@utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Global timeout for slow tests
jest.setTimeout(30000);
