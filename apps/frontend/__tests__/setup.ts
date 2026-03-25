/**
 * Vitest Global Setup for Frontend Component Tests
 * 
 * Configures:
 * - @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 * - Mock for Next.js router
 * - Mock for Next.js Image
 * - Global fetch mock
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ========================================
// Mock Next.js Router
// ========================================
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ========================================
// Mock Next.js Image
// ========================================
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return props;
  },
}));

// ========================================
// Mock window.matchMedia (for responsive components)
// ========================================
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ========================================
// Mock IntersectionObserver
// ========================================
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ========================================
// Mock ResizeObserver
// ========================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ========================================
// Suppress console errors for expected test failures
// ========================================
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    // Suppress React act() warnings in tests
    if (
      args[0].includes('Warning: An update to') ||
      args[0].includes('not wrapped in act(') ||
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    // Suppress React 18 batching warnings
    if (args[0].includes('ReactDOM.render is no longer supported')) {
      return;
    }
  }
  originalError.call(console, ...args);
};

// ========================================
// Global cleanup after each test
// ========================================
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
