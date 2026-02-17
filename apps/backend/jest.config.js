/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  // ========================================
  // Projekty: unit i integration
  // ========================================
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: [
        '<rootDir>/src/tests/unit/**/*.test.ts',
        // Legacy tests (flat structure) — do migracji
        '<rootDir>/src/tests/*.test.ts',
      ],
      setupFiles: ['<rootDir>/src/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^@routes/(.*)$': '<rootDir>/src/routes/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@constants/(.*)$': '<rootDir>/src/constants/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/setup.ts'],
      setupFilesAfterFramework: ['<rootDir>/src/tests/helpers/integration-setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^@routes/(.*)$': '<rootDir>/src/routes/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@constants/(.*)$': '<rootDir>/src/constants/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
  ],
  // ========================================
  // Coverage
  // ========================================
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/middlewares/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
};
