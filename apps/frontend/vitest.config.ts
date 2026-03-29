/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const frontendDir = fileURLToPath(new URL('./', import.meta.url));
const mock = (name: string) => path.join(frontendDir, '__mocks__', name);

export default defineConfig({
  // esbuild handles JSX natively — auto-imports React for JSX transform.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: [
      '__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', 'e2e/**', '.next'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: [
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/types/**', '__tests__/**', 'e2e/**'],
      thresholds: {
        branches: 50,
        functions: 30,
        lines: 15,
        statements: 15,
      },
    },
    // Single fork + no isolation: all tests run in one process,
    // avoiding repeated environment bootstrap (~10-50x faster).
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    isolate: true,
    fileParallelism: false,
    testTimeout: 10000,
  },

  // ====================================================================
  // Path aliases + heavy dependency stubs (ARRAY form — order matters!)
  // ====================================================================
  // resolve.alias redirects at the TRANSFORMATION level — Vitest/esbuild
  // never opens the real package. This is critical because vi.mock() only
  // prevents execution, NOT transformation of the dependency tree.
  //
  // More specific aliases MUST come before less specific ones.
  resolve: {
    alias: [
      // ── Heavy npm package stubs ──────────────────────────────────
      // Prevents esbuild from crawling thousands of internal modules.
      { find: 'framer-motion', replacement: mock('framer-motion.ts') },
      { find: 'lucide-react', replacement: mock('lucide-react.ts') },
      { find: 'sonner', replacement: mock('sonner.ts') },

      // ── Next.js stubs (prevents loading entire Next.js framework) ──
      { find: 'next/link', replacement: mock('next-link.tsx') },
      { find: 'next/navigation', replacement: mock('next-navigation.ts') },
      { find: 'next/image', replacement: mock('next-image.tsx') },

      // ── Radix UI stubs (prevents loading heavy primitives) ──
      { find: '@radix-ui/react-dialog', replacement: mock('radix-stub.ts') },
      { find: '@radix-ui/react-alert-dialog', replacement: mock('radix-stub.ts') },
      { find: '@radix-ui/react-select', replacement: mock('radix-stub.ts') },
      { find: '@radix-ui/react-switch', replacement: mock('radix-switch.ts') },
      { find: '@radix-ui/react-label', replacement: mock('radix-label.ts') },
      { find: '@radix-ui/react-dropdown-menu', replacement: mock('radix-stub.ts') },
      { find: '@radix-ui/react-tabs', replacement: mock('radix-tabs.ts') },
      { find: '@radix-ui/react-slot', replacement: mock('radix-stub.ts') },

      // ── Other heavy deps ──
      { find: 'class-variance-authority', replacement: mock('cva.ts') },

      // ── App-internal heavy module stubs ──────────────────────────
      // @/lib/utils imports date-fns + date-fns/locale/pl which is huge.
      // Must come BEFORE the generic @/lib alias.
      { find: '@/lib/utils', replacement: mock('lib-utils.ts') },

      // ── Standard app path aliases ────────────────────────────────
      { find: '@/components', replacement: path.join(frontendDir, 'components') },
      { find: '@/hooks', replacement: path.join(frontendDir, 'hooks') },
      { find: '@/lib', replacement: path.join(frontendDir, 'lib') },
      { find: '@/utils', replacement: path.join(frontendDir, 'utils') },
      { find: '@/types', replacement: path.join(frontendDir, 'types') },
      { find: '@', replacement: frontendDir },
    ],
  },
});
