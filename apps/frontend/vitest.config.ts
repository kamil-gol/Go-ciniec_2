/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'node:url';

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
        functions: 30,
        lines: 15,
        statements: 15,
      },
    },

    // ========================================
    // Performance — optimized for CI speed
    // ========================================
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    testTimeout: 10000,

    // ========================================
    // Dependency optimization
    // ========================================
    deps: {
      optimizer: {
        web: {
          // Pre-bundle heavy deps so they're not re-transformed per test file
          include: [
            '@testing-library/react',
            '@testing-library/jest-dom',
            '@testing-library/user-event',
            '@tanstack/react-query',
            'react',
            'react-dom',
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-toast',
            'framer-motion',
            'date-fns',
            'clsx',
            'class-variance-authority',
            'axios',
            'sonner',
            'cmdk',
            'lucide-react',
          ],
        },
      },
    },
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
