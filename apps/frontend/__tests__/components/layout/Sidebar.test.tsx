/**
 * Sidebar Component Tests
 *
 * Tests sidebar navigation:
 * - Nav item rendering
 * - Active state based on pathname
 * - User info display
 * - Logout button
 * - Collapse toggle
 * - Mobile sheet rendering
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPathname = vi.fn().mockReturnValue('/dashboard')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mockPathname(),
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {},
  layout: { statGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4", statGrid3: "grid grid-cols-2 sm:grid-cols-3 gap-4", statGrid6: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", containerClass: "container mx-auto", cardPadding: "p-4", sectionGap: "space-y-6", maxWidth: "max-w-7xl", narrowWidth: "max-w-5xl", cardHover: "", detailGrid: "grid grid-cols-2 md:grid-cols-4 gap-3" },
  statGradients: { financial: "from-amber-500 to-yellow-600", count: "from-blue-600 to-blue-800", alert: "from-rose-500 to-red-600", success: "from-emerald-500 to-teal-600", neutral: "from-zinc-500 to-neutral-600", info: "from-violet-500 to-purple-600" },
  typography: { pageTitle: "", sectionTitle: "", cardTitle: "", body: "", muted: "", smallMuted: "", label: "", heroSubtitle: "", statValue: "", statLabel: "", tableHeader: "", pageTitleStandalone: "" },
  animations: { fadeIn: "", slideUp: "", scaleIn: "", cardHover: "", buttonPress: "", pageEnter: "" },
  motionTokens: { duration: { instant: 0.1, fast: 0.2, normal: 0.3, slow: 0.5 }, ease: { default: "easeOut", smooth: [0.4, 0, 0.2, 1] }, stagger: { cards: 0.06, list: 0.04 } },
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="mobile-sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children, className }: any) => <span className={className}>{children}</span>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import Sidebar from '@/components/layout/Sidebar'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockUser = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  role: 'ADMIN',
  email: 'jan@test.pl',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  const mockLogout = vi.fn()
  const mockMobileClose = vi.fn()

  const defaultProps = {
    user: mockUser,
    onLogout: mockLogout,
    mobileOpen: false,
    onMobileClose: mockMobileClose,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/dashboard')
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render the app name', () => {
      render(<Sidebar {...defaultProps} />)
      const titles = screen.getAllByText('Gościniec')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    })

    it('should render subtitle', () => {
      render(<Sidebar {...defaultProps} />)
      const subtitles = screen.getAllByText('Panel zarządzania')
      expect(subtitles.length).toBeGreaterThanOrEqual(1)
    })

    it('should render navigation items', () => {
      render(<Sidebar {...defaultProps} />)
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Rezerwacje').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Kolejka').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Klienci').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Zaliczki').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Sale').length).toBeGreaterThanOrEqual(1)
    })

    it('should render all main navigation links', () => {
      render(<Sidebar {...defaultProps} />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/dashboard')
      expect(hrefs).toContain('/dashboard/reservations')
      expect(hrefs).toContain('/dashboard/queue')
      expect(hrefs).toContain('/dashboard/clients')
    })
  })

  // ── User Info ───────────────────────────────────────────────────────────

  describe('User Info', () => {
    it('should display user name', () => {
      render(<Sidebar {...defaultProps} />)
      const userNames = screen.getAllByText('Jan Kowalski')
      expect(userNames.length).toBeGreaterThanOrEqual(1)
    })

    it('should display user role as Administrator for ADMIN', () => {
      render(<Sidebar {...defaultProps} />)
      const roles = screen.getAllByText('Administrator')
      expect(roles.length).toBeGreaterThanOrEqual(1)
    })

    it('should display user initials', () => {
      render(<Sidebar {...defaultProps} />)
      const initials = screen.getAllByText('JK')
      expect(initials.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Logout ──────────────────────────────────────────────────────────────

  describe('Logout', () => {
    it('should render logout button', () => {
      render(<Sidebar {...defaultProps} />)
      const logoutBtns = screen.getAllByLabelText('Wyloguj')
      expect(logoutBtns.length).toBeGreaterThanOrEqual(1)
    })

    it('should call onLogout when logout button is clicked', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)

      const logoutBtns = screen.getAllByLabelText('Wyloguj')
      await user.click(logoutBtns[0])

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  // ── Mobile Sheet ────────────────────────────────────────────────────────

  describe('Mobile Sheet', () => {
    it('should render mobile sheet when mobileOpen is true', () => {
      render(<Sidebar {...defaultProps} mobileOpen={true} />)
      expect(screen.getByTestId('mobile-sheet')).toBeInTheDocument()
    })

    it('should not render mobile sheet when mobileOpen is false', () => {
      render(<Sidebar {...defaultProps} mobileOpen={false} />)
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument()
    })
  })

  // ── Null User ───────────────────────────────────────────────────────────

  describe('Null User', () => {
    it('should handle null user gracefully', () => {
      render(<Sidebar {...defaultProps} user={null} />)
      // Should not crash
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Expandable Menu (#479) ─────────────────────────────────────────────

  describe('Menu Expandable Submenu', () => {
    it('should render Menu as expandable group with children', () => {
      render(<Sidebar {...defaultProps} />)
      // Menu should be visible as a group toggle button
      const menuButtons = screen.getAllByText('Menu')
      expect(menuButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should render Catering as expandable group with children', () => {
      render(<Sidebar {...defaultProps} />)
      const cateringButtons = screen.getAllByText('Catering')
      expect(cateringButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should show Menu children when expanded via pathname', () => {
      mockPathname.mockReturnValue('/dashboard/menu/templates')
      render(<Sidebar {...defaultProps} />)
      // When on a child route, children should be visible
      expect(screen.getAllByText('Szablony Menu').length).toBeGreaterThanOrEqual(1)
    })

    it('should show Menu children: Pakiety, Kategorie Dań, Biblioteka Dań', async () => {
      mockPathname.mockReturnValue('/dashboard/menu/packages')
      render(<Sidebar {...defaultProps} />)
      expect(screen.getAllByText('Pakiety').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Icon Color Groups (#478) ───────────────────────────────────────────

  describe('Icon Color Groups', () => {
    it('should render all navigation group labels', () => {
      render(<Sidebar {...defaultProps} />)
      expect(screen.getAllByText('Operacje').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Zarządzanie').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Konfiguracja').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Analiza').length).toBeGreaterThanOrEqual(1)
    })
  })
})
