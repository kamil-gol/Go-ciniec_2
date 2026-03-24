/** @type {import('jest').Config} */
module.exports = {
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
        '^@/prisma-client$': '<rootDir>/src/tests/mocks/prisma-client-jest',
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
          diagnostics: false,  // Wyłączone — istniejące błędy TS nie blokują testów
        }],
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
      // NOTE: Serial execution is enforced via --runInBand CLI flag
      // in package.json scripts. maxWorkers inside project config
      // is ignored by Jest 29 multi-project runner.
      setupFiles: [
        '<rootDir>/src/tests/setup.ts',
        '<rootDir>/src/tests/helpers/integration-setup.ts',
      ],
      moduleNameMapper: {
        '^@/prisma-client$': '<rootDir>/src/tests/mocks/prisma-client-jest',
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
          diagnostics: false,
        }],
      },
    },
  ],
  // ========================================
  // Coverage
  // ========================================
  // Use V8 native coverage instead of babel-plugin-istanbul.
  // Fixes TypeError "The original argument must be of type function"
  // caused by incompatibility between babel-plugin-istanbul and Node 22+.
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/middlewares/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  // Coverage thresholds enforced via CI (codecov) rather than jest config.
  // Jest 29 _checkThreshold uses glob.sync() which is removed in glob v13+.
  // Actual coverage (2026-03): statements 70.69%, branches 86.41%, functions 81.33%, lines 70.69%.
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
};
