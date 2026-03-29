/**
 * Menu Dashboard Page Tests
 *
 * Tests the menu dashboard page (/dashboard/menu):
 * - Renders page hero with title "Moduł Menu"
 * - Shows navigation cards (Templates, Packages, Categories, Dishes)
 * - Displays correct stats from hooks data
 * - Renders links to sub-pages
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseMenuTemplates, mockUseDishes, mockUseDishCategories } = vi.hoisted(() => ({
  mockUseMenuTemplates: vi.fn(),
  mockUseDishes: vi.fn(),
  mockUseDishCategories: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/menu',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/hooks/use-menu', () => ({
  useMenuTemplates: mockUseMenuTemplates,
}))

vi.mock('@/hooks/use-dishes', () => ({
  useDishes: mockUseDishes,
}))

vi.mock('@/hooks/use-menu-config', () => ({
  useDishCategories: mockUseDishCategories,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    menu: {
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-600',
      textDark: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-500',
      gradientSubtle: 'from-emerald-50 to-teal-50',
    },
  },
}))

vi.mock('@/components/shared', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
  PageHero: ({ title, subtitle, stats }: any) => (
    <div data-testid="page-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {stats?.map((s: any) => (
        <span key={s.label} data-testid={`hero-stat-${s.label}`}>{s.value}</span>
      ))}
    </div>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import MenuDashboardPage from '@/app/dashboard/menu/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockTemplates = [
  { id: 't-1', name: 'Wesele Standard', isActive: true, packages: [{ id: 'p-1' }, { id: 'p-2' }] },
  { id: 't-2', name: 'Komunia Basic', isActive: false, packages: [{ id: 'p-3' }] },
]

const mockDishes = [
  { id: 'd-1', name: 'Rosół' },
  { id: 'd-2', name: 'Schabowy' },
  { id: 'd-3', name: 'Pierogi' },
]

const mockCategories = [
  { id: 'c-1', name: 'Zupy' },
  { id: 'c-2', name: 'Dania główne' },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MenuDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates })
    mockUseDishes.mockReturnValue({ data: mockDishes })
    mockUseDishCategories.mockReturnValue({ data: mockCategories })
  })

  it('renders page hero with title', () => {
    render(<MenuDashboardPage />)
    expect(screen.getByText('Moduł Menu')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<MenuDashboardPage />)
    expect(screen.getByText(/Kompleksowe zarządzanie menu/)).toBeInTheDocument()
  })

  it('shows hero stats with correct values', () => {
    render(<MenuDashboardPage />)
    // 3 dishes, 2 templates, 3 packages
    expect(screen.getByTestId('hero-stat-Dania')).toHaveTextContent('3')
    expect(screen.getByTestId('hero-stat-Szablony')).toHaveTextContent('2')
    expect(screen.getByTestId('hero-stat-Pakiety')).toHaveTextContent('3')
  })

  it('renders navigation cards for sub-modules', () => {
    render(<MenuDashboardPage />)
    expect(screen.getByText('Szablony Menu')).toBeInTheDocument()
    expect(screen.getByText('Pakiety')).toBeInTheDocument()
    expect(screen.getByText('Kategorie Dań')).toBeInTheDocument()
    expect(screen.getByText('Biblioteka Dań')).toBeInTheDocument()
  })

  it('renders links to correct sub-pages', () => {
    render(<MenuDashboardPage />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/dashboard/menu/templates')
    expect(hrefs).toContain('/dashboard/menu/packages')
    expect(hrefs).toContain('/dashboard/menu/categories')
    expect(hrefs).toContain('/dashboard/menu/dishes')
  })

  it('handles empty data gracefully', () => {
    mockUseMenuTemplates.mockReturnValue({ data: [] })
    mockUseDishes.mockReturnValue({ data: [] })
    mockUseDishCategories.mockReturnValue({ data: [] })

    render(<MenuDashboardPage />)
    expect(screen.getByText('Moduł Menu')).toBeInTheDocument()
    expect(screen.getByTestId('hero-stat-Dania')).toHaveTextContent('0')
  })
})
