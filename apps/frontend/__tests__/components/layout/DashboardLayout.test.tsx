import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockPush, mockPathname, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPathname: vi.fn(() => '/dashboard'),
  mockGet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  usePathname: mockPathname,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: mockGet },
}))

vi.mock('@/lib/design-tokens', () => ({
  motionTokens: {
    duration: { instant: 0.1, fast: 0.2, normal: 0.3, medium: 0.4, slow: 0.5 },
    ease: { default: 'easeOut', smooth: [0.4, 0, 0.2, 1] },
    spring: { stiffness: 360, damping: 28 },
    stagger: { cards: 0.06, list: 0.04 },
  },
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className} data-testid="motion-div">{children}</div>
    ),
  },
}))

vi.mock('@/components/layout/Sidebar', () => ({
  default: ({ user, onLogout }: any) => (
    <div data-testid="sidebar">{user?.name}</div>
  ),
}))

vi.mock('@/components/layout/Header', () => ({
  default: ({ user, onMenuClick }: any) => (
    <div data-testid="header">{user?.name}</div>
  ),
}))

vi.mock('@/app/dashboard/components/SessionTimeoutModal', () => ({
  default: () => <div data-testid="session-timeout-modal" />,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import DashboardLayout from '@/components/layout/DashboardLayout'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardLayout', () => {
  let mockLocalStorage: Record<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
        setItem: vi.fn((key: string, val: string) => { mockLocalStorage[key] = val }),
        removeItem: vi.fn((key: string) => { delete mockLocalStorage[key] }),
        clear: vi.fn(() => { mockLocalStorage = {} }),
      },
      writable: true,
    })
  })

  it('redirects to login when no auth token', async () => {
    render(<DashboardLayout><div>Page</div></DashboardLayout>)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('shows loading spinner initially', () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockReturnValue(new Promise(() => {})) // Never resolves
    render(<DashboardLayout><div>Page</div></DashboardLayout>)
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
  })

  it('renders children after successful auth', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockResolvedValue({ data: { data: { user: { name: 'Test User' } } } })

    render(<DashboardLayout><div>Page Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(screen.getByText('Page Content')).toBeInTheDocument()
    })
  })

  it('renders sidebar and header with user data', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockResolvedValue({ data: { data: { user: { name: 'Jan Kowalski' } } } })

    render(<DashboardLayout><div>Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toHaveTextContent('Jan Kowalski')
      expect(screen.getByTestId('header')).toHaveTextContent('Jan Kowalski')
    })
  })

  it('renders AnimatePresence wrapper for page transitions', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockResolvedValue({ data: { data: { user: { name: 'User' } } } })

    render(<DashboardLayout><div>Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('animate-presence')).toBeInTheDocument()
    })
  })

  it('renders SessionTimeoutModal', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockResolvedValue({ data: { data: { user: { name: 'User' } } } })

    render(<DashboardLayout><div>Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument()
    })
  })

  it('renders main content area with correct id', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockResolvedValue({ data: { data: { user: { name: 'User' } } } })

    render(<DashboardLayout><div>Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(document.getElementById('main-content')).toBeInTheDocument()
    })
  })

  it('redirects to login on API error', async () => {
    mockLocalStorage['auth_token'] = 'test-token'
    mockGet.mockRejectedValue(new Error('Unauthorized'))

    render(<DashboardLayout><div>Content</div></DashboardLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
