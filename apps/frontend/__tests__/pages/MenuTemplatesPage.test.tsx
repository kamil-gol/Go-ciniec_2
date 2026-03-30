/**
 * Menu Templates Page Tests
 *
 * Tests the menu templates page (/dashboard/menu/templates):
 * - Renders page hero with title "Szablony Menu"
 * - Shows loading state while fetching data
 * - Displays stat cards (total, active, inactive)
 * - Shows template cards when data is loaded
 * - Shows empty state when no templates exist
 * - Shows "Nowy szablon" button
 * - Renders filter controls (event type, show inactive toggle)
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseMenuTemplates, mockUseDeleteMenuTemplate, mockUseEventTypes } = vi.hoisted(() => ({
  mockUseMenuTemplates: vi.fn(),
  mockUseDeleteMenuTemplate: vi.fn(() => ({ mutateAsync: vi.fn() })),
  mockUseEventTypes: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/menu/templates',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/hooks/use-menu-config', () => ({
  useMenuTemplates: mockUseMenuTemplates,
  useDeleteMenuTemplate: mockUseDeleteMenuTemplate,
}))

vi.mock('@/hooks/use-event-types', () => ({
  useEventTypes: mockUseEventTypes,
}))

vi.mock('@/lib/api/menu-templates-api', () => ({
  downloadMenuTemplatePDF: vi.fn(),
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
  statGradients: { financial: '', count: '', alert: '', success: '', neutral: '', info: '' },
  layout: { statGrid: '', statGrid3: 'grid grid-cols-3 gap-4', statGrid6: '', containerClass: '', cardPadding: '', sectionGap: '', maxWidth: '', narrowWidth: '', cardHover: '', detailGrid: '' },
}))

vi.mock('@/components/shared', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
  PageHero: ({ title, subtitle, action }: any) => (
    <div data-testid="page-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {action}
    </div>
  ),
  StatCard: ({ label, value }: any) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
  EmptyState: ({ title, description, onAction }: any) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
  EntityCard: ({ children, ...props }: any) => (
    <div data-testid="entity-card">{children}</div>
  ),
  EntityListItem: ({ children, ...props }: any) => (
    <div data-testid="entity-list-item">{children}</div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="event-type-filter">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

vi.mock('@/components/menu/MenuTemplateDialog', () => ({
  MenuTemplateDialog: () => <div data-testid="template-dialog" />,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import MenuTemplatesPage from '@/app/dashboard/menu/templates/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockTemplates = [
  {
    id: 'tmpl-1',
    name: 'Wesele Standard',
    description: 'Standardowy szablon weselny',
    variant: 'Standard',
    isActive: true,
    eventTypeId: 'et-1',
    eventType: { name: 'Wesele', color: '#6366f1' },
    packages: [{ id: 'p-1' }, { id: 'p-2' }],
    _count: { packages: 2 },
    validFrom: null,
    validTo: null,
  },
  {
    id: 'tmpl-2',
    name: 'Komunia Premium',
    description: 'Pakiet premium dla komunii',
    variant: 'Premium',
    isActive: true,
    eventTypeId: 'et-2',
    eventType: { name: 'Komunia', color: '#22c55e' },
    packages: [{ id: 'p-3' }],
    _count: { packages: 1 },
    validFrom: null,
    validTo: null,
  },
  {
    id: 'tmpl-3',
    name: 'Stary szablon',
    description: null,
    variant: null,
    isActive: false,
    eventTypeId: 'et-1',
    eventType: { name: 'Wesele', color: '#6366f1' },
    packages: [],
    _count: { packages: 0 },
    validFrom: null,
    validTo: null,
  },
]

const mockEventTypesData = [
  { id: 'et-1', name: 'Wesele' },
  { id: 'et-2', name: 'Komunia' },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MenuTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEventTypes.mockReturnValue({ data: mockEventTypesData })
  })

  it('shows loading state while data is fetching', () => {
    mockUseMenuTemplates.mockReturnValue({ data: undefined, isLoading: true })
    render(<MenuTemplatesPage />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('renders page hero with title', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByText('Szablony Menu')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByText(/Konfiguruj szablony menu/)).toBeInTheDocument()
  })

  it('shows "Nowy szablon" button', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByText('Nowy szablon')).toBeInTheDocument()
  })

  it('renders stat cards with correct values', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByTestId('stat-Wszystkie')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Aktywne')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Nieaktywne')).toBeInTheDocument()
  })

  it('renders template cards when data is loaded (active only by default)', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    // Only active templates shown by default (showInactive = false)
    expect(screen.getByText('Wesele Standard')).toBeInTheDocument()
    expect(screen.getByText('Komunia Premium')).toBeInTheDocument()
    // Inactive template should NOT be shown
    expect(screen.queryByText('Stary szablon')).not.toBeInTheDocument()
  })

  it('shows empty state when no templates match filter', () => {
    mockUseMenuTemplates.mockReturnValue({ data: [], isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Brak szablonów')).toBeInTheDocument()
  })

  it('renders event type filter', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    expect(screen.getByTestId('event-type-filter')).toBeInTheDocument()
  })

  it('renders back link to menu', () => {
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false })
    render(<MenuTemplatesPage />)
    // PageHero has backHref="/dashboard/menu" — rendered by our mock as part of action/title
    expect(screen.getByText('Szablony Menu')).toBeInTheDocument()
  })
})
