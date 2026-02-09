"use strict";
// Jest setup file
// This file runs before the test suite starts
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/rezerwacje_test';
// Suppress logs during tests
jest.mock('@utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));
//# sourceMappingURL=setup.js.map