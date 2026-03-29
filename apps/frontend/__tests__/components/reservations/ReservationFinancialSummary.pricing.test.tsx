/**
 * ReservationFinancialSummary — testy kalkulacji ceny (issue #459)
 *
 * Weryfikuje że "Razem do zapłaty" wyświetla poprawną kwotę
 * bez double-countingu dla rezerwacji bez pakietu menu.
 *
 * Każdy test sprawdza: wyświetlona kwota == oczekiwana suma komponentów.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReservationFinancialSummary } from '@/components/reservations/ReservationFinancialSummary'
import { useReservationMenu } from '@/hooks/use-menu'
import { useReservationExtras } from '@/hooks/use-service-extras'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dashboard/reservations/test-id',
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/use-menu')
vi.mock('@/hooks/use-service-extras')

// Depozyty — puste
vi.mock('@/lib/api/deposits', () => ({
  depositsApi: {
    getByReservation: vi.fn().mockResolvedValue([]),
  },
}))

// DiscountSection — stub (logika nie jest przedmiotem testu)
vi.mock('@/components/reservations/DiscountSection', () => ({
  DiscountSection: () => <div data-testid="discount-section" />,
}))

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parsuje tekst kwoty, np. "2 000" → 2000, "11 148" → 11148 */
function parseDisplayedPrice(text: string | null): number {
  if (!text) return -1
  return parseFloat(text.replace(/\s/g, '').replace(',', '.'))
}

const BASE_PROPS = {
  reservationId: 'test-res-id',
  adults: 10,
  childrenCount: 0,
  toddlers: 0,
  pricePerAdult: 200,
  pricePerChild: 0,
  pricePerToddler: 0,
  totalPrice: 2000,
  status: 'CONFIRMED',
}

// ── Default mock values ───────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(useReservationMenu).mockReturnValue({
    data: null,
    isLoading: false,
  } as any)

  vi.mocked(useReservationExtras).mockReturnValue({
    data: { data: [], totalExtrasPrice: 0 },
    isLoading: false,
  } as any)
})

// ── Testy ──────────────────────────────────────────────────────────────────

describe('ReservationFinancialSummary — kalkulacja ceny (no-menu)', () => {

  it('CASE 1: no-menu, no extras — wyświetla perPersonBase', async () => {
    // adults=10, pricePerAdult=200 → 2000
    render(<ReservationFinancialSummary {...BASE_PROPS} />)

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(2000)
  })

  it('CASE 2: no-menu + extras 500 zł — NIE podwaja extras', async () => {
    // base=2000 + extras=500 = 2500 (nie 3000)
    vi.mocked(useReservationExtras).mockReturnValue({
      data: { data: [{ id: 'e1', status: 'ACTIVE', totalPrice: 500 }], totalExtrasPrice: 500 },
      isLoading: false,
    } as any)

    render(<ReservationFinancialSummary {...BASE_PROPS} totalPrice={2500} />)

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(2500)
  })

  it('CASE 3: no-menu + venueSurcharge 300 — NIE podwaja surcharge', async () => {
    // base=2000 + surcharge=300 = 2300 (nie 2600)
    render(
      <ReservationFinancialSummary
        {...BASE_PROPS}
        totalPrice={2300}
        venueSurcharge={300}
        venueSurchargeLabel="Dopłata za cały obiekt (< 30 os.)"
      />
    )

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(2300)
  })

  it('CASE 4: no-menu + extra hours 2h×500 — NIE podwaja extraHoursCost', async () => {
    // base=2000, event 14:00-22:00 = 8h, standardHours=6, extra=2×500=1000 → 3000
    const start = '2026-06-15T14:00:00.000Z'
    const end   = '2026-06-15T22:00:00.000Z'

    render(
      <ReservationFinancialSummary
        {...BASE_PROPS}
        totalPrice={3000}
        startDateTime={start}
        endDateTime={end}
        standardHours={6}
        extraHourRate={500}
      />
    )

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(3000)
  })

  it('CASE 5: no-menu + discount PERCENTAGE 10% od 2500 → 2250', async () => {
    // base=2000, extras=500 → przed rabatem=2500, rabat 10%=250 → 2250
    vi.mocked(useReservationExtras).mockReturnValue({
      data: { data: [{ id: 'e1', status: 'ACTIVE', totalPrice: 500 }], totalExtrasPrice: 500 },
      isLoading: false,
    } as any)

    render(
      <ReservationFinancialSummary
        {...BASE_PROPS}
        totalPrice={2250}
        priceBeforeDiscount={2500}
        discountType="PERCENTAGE"
        discountValue={10}
        discountAmount={250}
      />
    )

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(2250)
  })

  it('CASE 6: z menu snapshot — totalMenuPrice jest bazą, extras dodawane raz', async () => {
    // menu totalMenuPrice=3000, extras=500 → 3500
    vi.mocked(useReservationMenu).mockReturnValue({
      data: {
        snapshot: { id: 'snap-1' },
        priceBreakdown: {
          totalMenuPrice: 3000,
          packageCost: {
            subtotal: 3000,
            adults: { priceEach: 200, count: 10, subtotal: 2000 },
            children: { priceEach: 0, count: 0, subtotal: 0 },
            toddlers: { priceEach: 0, count: 0, subtotal: 0 },
          },
          optionsSubtotal: 0,
        },
      },
      isLoading: false,
    } as any)

    vi.mocked(useReservationExtras).mockReturnValue({
      data: { data: [{ id: 'e1', status: 'ACTIVE', totalPrice: 500 }], totalExtrasPrice: 500 },
      isLoading: false,
    } as any)

    render(<ReservationFinancialSummary {...BASE_PROPS} totalPrice={3500} />)

    const el = await screen.findByTestId('final-total-price')
    expect(parseDisplayedPrice(el.textContent)).toBe(3500)
  })
})
