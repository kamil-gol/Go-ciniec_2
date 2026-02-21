/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
        functions: 55,
        lines: 60,
        statements: 60,
      },
    },

    // ========================================
    // Performance
    // ========================================
    pool: 'forks',
    testTimeout: 10000,
  },

  // ========================================
  // Path aliases (match tsconfig/next.config)
  // ========================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
});
