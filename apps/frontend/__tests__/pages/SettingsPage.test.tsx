/**
 * Settings Page Tests
 *
 * Tests the settings page (/dashboard/settings):
 * - Renders page hero with title and subtitle
 * - Displays four tab triggers (Users, Roles, Company, Archive)
 * - Default tab is "users"
 * - Each tab content component renders
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/settings',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    settings: {
      iconBg: 'bg-neutral-500',
      text: 'text-neutral-600',
      textDark: 'text-neutral-400',
      gradient: 'from-neutral-500 to-slate-500',
      gradientSubtle: 'from-neutral-50 to-slate-50',
    },
  },
  layout: { statGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4", statGrid3: "grid grid-cols-2 sm:grid-cols-3 gap-4", statGrid6: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", containerClass: "container mx-auto", cardPadding: "p-4", sectionGap: "space-y-6", maxWidth: "max-w-7xl", narrowWidth: "max-w-5xl", cardHover: "", detailGrid: "grid grid-cols-2 md:grid-cols-4 gap-3" },
  statGradients: { financial: "from-amber-500 to-yellow-600", count: "from-blue-600 to-blue-800", alert: "from-rose-500 to-red-600", success: "from-emerald-500 to-teal-600", neutral: "from-zinc-500 to-neutral-600", info: "from-violet-500 to-purple-600" },
  typography: { pageTitle: "", sectionTitle: "", cardTitle: "", body: "", muted: "", smallMuted: "", label: "", heroSubtitle: "", statValue: "", statLabel: "", tableHeader: "", pageTitleStandalone: "" },
  animations: { fadeIn: "", slideUp: "", scaleIn: "", cardHover: "", buttonPress: "", pageEnter: "" },
  motionTokens: { duration: { instant: 0.1, fast: 0.2, normal: 0.3, slow: 0.5 }, ease: { default: "easeOut", smooth: [0.4, 0, 0.2, 1] }, stagger: { cards: 0.06, list: 0.04 } },
}))

vi.mock('@/components/shared', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
  PageHero: ({ title, subtitle }: any) => (
    <div data-testid="page-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list" role="tablist">{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button role="tab" data-value={value} {...props}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`} role="tabpanel">{children}</div>
  ),
}))

vi.mock('@/components/settings/UsersTab', () => ({
  UsersTab: () => <div data-testid="users-tab">Zarządzanie użytkownikami</div>,
}))

vi.mock('@/components/settings/RolesTab', () => ({
  RolesTab: () => <div data-testid="roles-tab">Zarządzanie rolami</div>,
}))

vi.mock('@/components/settings/CompanyTab', () => ({
  CompanyTab: () => <div data-testid="company-tab">Dane firmy</div>,
}))

vi.mock('@/components/settings/ArchiveTab', () => ({
  ArchiveTab: () => <div data-testid="archive-tab">Archiwizacja danych</div>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import SettingsPage from '@/app/dashboard/settings/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page hero with title', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Ustawienia')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<SettingsPage />)
    expect(screen.getByText(/Zarządzanie użytkownikami, rolami/)).toBeInTheDocument()
  })

  it('renders four tab triggers', () => {
    render(<SettingsPage />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
  })

  it('renders Users tab trigger with icon', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Użytkownicy')).toBeInTheDocument()
  })

  it('renders Roles tab trigger', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Role i uprawnienia')).toBeInTheDocument()
  })

  it('renders Company tab trigger', () => {
    render(<SettingsPage />)
    const matches = screen.getAllByText('Dane firmy')
    // One from tab trigger, one from CompanyTab content mock
    expect(matches.length).toBeGreaterThanOrEqual(1)
    // Check that at least one is a tab trigger button
    const tabTrigger = matches.find(el => el.closest('[role="tab"]'))
    expect(tabTrigger).toBeTruthy()
  })

  it('renders Archive tab trigger', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Archiwizacja')).toBeInTheDocument()
  })

  it('default tab value is "users"', () => {
    render(<SettingsPage />)
    const tabs = screen.getByTestId('tabs')
    expect(tabs).toHaveAttribute('data-value', 'users')
  })

  it('renders UsersTab content', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('users-tab')).toBeInTheDocument()
  })

  it('renders RolesTab content', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('roles-tab')).toBeInTheDocument()
  })

  it('renders CompanyTab content', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('company-tab')).toBeInTheDocument()
  })

  it('renders ArchiveTab content', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('archive-tab')).toBeInTheDocument()
  })
})
