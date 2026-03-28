/**
 * HallCard Component Tests
 *
 * Tests hall card display:
 * - Hall name, capacity, description
 * - Active/inactive badge
 * - Whole venue badge
 * - Multiple bookings badge
 * - Amenities display
 * - CTA button link
 * - Dropdown menu (details, edit, delete)
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    halls: {
      iconBg: 'bg-sky-500',
      text: 'text-sky-600',
      textDark: 'text-sky-400',
      gradient: 'from-sky-500 to-blue-600',
      badge: 'bg-sky-50',
      badgeText: 'text-sky-700',
    },
  },
  layout: { statGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4", statGrid3: "grid grid-cols-2 sm:grid-cols-3 gap-4", statGrid6: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", containerClass: "container mx-auto", cardPadding: "p-4", sectionGap: "space-y-6", maxWidth: "max-w-7xl", narrowWidth: "max-w-5xl", cardHover: "", detailGrid: "grid grid-cols-2 md:grid-cols-4 gap-3" },
  statGradients: { financial: "from-amber-500 to-yellow-600", count: "from-blue-600 to-blue-800", alert: "from-rose-500 to-red-600", success: "from-emerald-500 to-teal-600", neutral: "from-zinc-500 to-neutral-600", info: "from-violet-500 to-purple-600" },
  typography: { pageTitle: "", sectionTitle: "", cardTitle: "", body: "", muted: "", smallMuted: "", label: "", heroSubtitle: "", statValue: "", statLabel: "", tableHeader: "", pageTitleStandalone: "" },
  animations: { fadeIn: "", slideUp: "", scaleIn: "", cardHover: "", buttonPress: "", pageEnter: "" },
  motionTokens: { duration: { instant: 0.1, fast: 0.2, normal: 0.3, slow: 0.5 }, ease: { default: "easeOut", smooth: [0.4, 0, 0.2, 1] }, stagger: { cards: 0.06, list: 0.04 } },
}))

vi.mock('@/lib/api/halls', () => ({
  deleteHall: vi.fn(),
  updateHall: vi.fn(),
}))

vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    ConfirmDialog: null,
  }),
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockHall = {
  id: 'hall-1',
  name: 'Sala Główna',
  capacity: 200,
  description: 'Przestronna sala bankietowa z parkietem.',
  amenities: ['Klimatyzacja', 'Parkiet', 'Nagłośnienie', 'Dekoracje'],
  images: [],
  isActive: true,
  isWholeVenue: false,
  allowMultipleBookings: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockWholeVenueHall = {
  ...mockHall,
  id: 'hall-whole',
  name: 'Cały Obiekt',
  isWholeVenue: true,
  capacity: 500,
  amenities: [],
  description: undefined,
}

const mockInactiveHall = {
  ...mockHall,
  id: 'hall-inactive',
  name: 'Sala Zamknięta',
  isActive: false,
}

const mockMultiBookingHall = {
  ...mockHall,
  id: 'hall-multi',
  name: 'Sala Wielofunkcyjna',
  allowMultipleBookings: true,
}

// ── Import ───────────────────────────────────────────────────────────────────

import { HallCard } from '@/components/halls/hall-card'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('HallCard', () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render hall name', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Sala Główna')).toBeInTheDocument()
    })

    it('should render capacity', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('200 osób')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Przestronna sala bankietowa z parkietem.')).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
      render(<HallCard hall={mockWholeVenueHall} onUpdate={mockOnUpdate} />)
      expect(screen.queryByText('Przestronna sala bankietowa z parkietem.')).not.toBeInTheDocument()
    })

    it('should render CTA button linking to hall calendar', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Zobacz Kalendarz')).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      const hrefs = links.map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/dashboard/halls/hall-1')
    })
  })

  // ── Status Badges ───────────────────────────────────────────────────────

  describe('Status Badges', () => {
    it('should show Aktywna badge for active halls', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Aktywna')).toBeInTheDocument()
    })

    it('should show Nieaktywna badge for inactive halls', () => {
      render(<HallCard hall={mockInactiveHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Nieaktywna')).toBeInTheDocument()
    })

    it('should show Cały Obiekt badge for whole venue halls', () => {
      render(<HallCard hall={mockWholeVenueHall} onUpdate={mockOnUpdate} />)
      // "Cały Obiekt" appears as both the hall name (h3) and a badge
      const elements = screen.getAllByText('Cały Obiekt')
      expect(elements.length).toBeGreaterThanOrEqual(2)
    })

    it('should show Wyłączność badge when multiple bookings disabled', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Wyłączność')).toBeInTheDocument()
    })

    it('should show Wiele rezerwacji badge when multiple bookings enabled', () => {
      render(<HallCard hall={mockMultiBookingHall} onUpdate={mockOnUpdate} />)
      // "Wiele rezerwacji" appears as both a badge and a toggle label
      const elements = screen.getAllByText('Wiele rezerwacji')
      expect(elements.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── Amenities ───────────────────────────────────────────────────────────

  describe('Amenities', () => {
    it('should show up to 3 amenities', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Klimatyzacja')).toBeInTheDocument()
      expect(screen.getByText('Parkiet')).toBeInTheDocument()
      expect(screen.getByText('Nagłośnienie')).toBeInTheDocument()
    })

    it('should show +N more badge when more than 3 amenities', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('+1 więcej')).toBeInTheDocument()
    })

    it('should not show amenities when list is empty', () => {
      render(<HallCard hall={mockWholeVenueHall} onUpdate={mockOnUpdate} />)
      expect(screen.queryByText('Klimatyzacja')).not.toBeInTheDocument()
    })
  })

  // ── Dropdown Menu ───────────────────────────────────────────────────────

  describe('Dropdown Menu', () => {
    it('should render options button', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByLabelText('Opcje sali')).toBeInTheDocument()
    })
  })

  // ── Multiple Bookings Toggle ────────────────────────────────────────────

  describe('Multiple Bookings Toggle', () => {
    it('should render toggle with label', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Wiele rezerwacji')).toBeInTheDocument()
    })

    it('should render switch element', () => {
      render(<HallCard hall={mockHall} onUpdate={mockOnUpdate} />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toBeInTheDocument()
    })
  })
})
