/**
 * Lightweight sonner stub — toast methods are vi.fn() spies for test assertions.
 */
import { vi } from 'vitest';

export const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
};

export const Toaster = () => null;
