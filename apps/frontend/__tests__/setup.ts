/**
 * Vitest Global Setup for Frontend Component Tests
 *
 * Heavy dependencies (framer-motion, lucide-react, sonner, next/*, @/lib/utils)
 * are handled via resolve.alias in vitest.config.ts — NOT vi.mock().
 * This prevents esbuild from even opening the real package files.
 *
 * vi.mock() here is only for modules NOT aliased in config.
 */
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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
// Mock scrollIntoView (not in happy-dom)
// ========================================
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}

// ========================================
// Suppress console errors for expected test failures
// ========================================
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (
      args[0].includes('Warning: An update to') ||
      args[0].includes('not wrapped in act(') ||
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    if (args[0].includes('ReactDOM.render is no longer supported')) {
      return;
    }
  }
  originalError.call(console, ...args);
};

// ========================================
// Global cleanup after each test
// ========================================
afterEach(() => {
  cleanup();
});
