/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // No React plugin — esbuild handles JSX natively, avoiding the massive
  // overhead of @vitejs/plugin-react (Babel) which caused CI timeouts.
  test: {
    // ========================================
    // Environment
    // ========================================
    environment: 'jsdom',
    globals: true,

    // ========================================
    // Setup
    // ========================================
    setupFiles: ['./__tests__/setup.ts'],

    // ========================================
    // Test matching
    // ========================================
    include: [
      '__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'e2e/**', // E2E tests use Playwright, not Vitest
      '.next',
    ],

    // ========================================
    // Behavior
    // ========================================
    passWithNoTests: true,

    // ========================================
    // Coverage
    // ========================================
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: [
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '__tests__/**',
        'e2e/**',
      ],
      thresholds: {
        branches: 50,
        functions: 30,
        lines: 15,
        statements: 15,
      },
    },

    // ========================================
    // Performance — optimized for CI speed
    // ========================================
    // Single fork + no isolation: all tests run in one process,
    // avoiding repeated jsdom + React + Radix UI bootstrap (~10-50x faster).
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    isolate: false,
    fileParallelism: false,
    testTimeout: 10000,
  },

  // ========================================
  // Path aliases (match tsconfig/next.config)
  // ========================================
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '@/components': fileURLToPath(new URL('./components', import.meta.url)),
      '@/hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
      '@/lib': fileURLToPath(new URL('./lib', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./utils', import.meta.url)),
      '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    },
  },
});
