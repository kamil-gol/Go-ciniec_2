/**
 * UnifiedFinancialSummary Component Tests
 *
 * Tests the shared financial summary component used in Reservations and Catering:
 * - Renders title, total price, per-person price
 * - Renders line items (flat mode)
 * - Renders collapsible line groups (breakdown mode)
 * - Renders discount info
 * - Renders balance bar when deposits present
 * - Slots: discountSlot, depositsSlot, headerAction
 *
 * Issue: #538
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Utensils, Star } from 'lucide-react'
import { UnifiedFinancialSummary } from '@/components/shared/UnifiedFinancialSummary'
import type { FinancialLineItem, FinancialLineGroup, FinancialBalance, FinancialDiscount } from '@/components/shared/UnifiedFinancialSummary'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLineItems(): FinancialLineItem[] {
  return [
    { id: 'dishes', icon: <Utensils className="w-3.5 h-3.5" />, label: 'Dania', amount: 1500 },
    { id: 'extras', icon: <Star className="w-3.5 h-3.5" />, label: 'Usługi dodatkowe', amount: 500 },
  ]
}

function makeLineGroups(): FinancialLineGroup[] {
  return [
    {
      id: 'package',
      title: 'Pakiet gastronomiczny',
      items: [
        { id: 'adults', label: 'Dorośli (10 × 150,00 zł)', amount: 1500 },
        { id: 'children', label: 'Dzieci (5 × 80,00 zł)', amount: 400 },
      ],
      subtotal: 1900,
    },
  ]
}

function makeBalance(overrides: Partial<FinancialBalance> = {}): FinancialBalance {
  return {
    totalPaid: 1000,
    totalCommitted: 1500,
    totalPending: 500,
    remaining: 1000,
    percentPaid: 50,
    percentCommitted: 75,
    depositsCount: 2,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UnifiedFinancialSummary', () => {
  describe('Total display', () => {
    it('renders total price', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} />)
      expect(screen.getByTestId('final-total-price')).toBeInTheDocument()
      expect(screen.getByTestId('final-total-price').textContent).toContain('2')
    })

    it('renders default title', () => {
      render(<UnifiedFinancialSummary totalPrice={1000} />)
      expect(screen.getByText('Podsumowanie finansowe')).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(<UnifiedFinancialSummary totalPrice={1000} title="Rozliczenie" />)
      expect(screen.getByText('Rozliczenie')).toBeInTheDocument()
    })

    it('renders per-person price when provided', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} pricePerPerson={200} />)
      expect(screen.getByText(/osobę/)).toBeInTheDocument()
    })

    it('does not render per-person price when null', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} pricePerPerson={null} />)
      expect(screen.queryByText(/osobę/)).not.toBeInTheDocument()
    })

    it('does not render per-person price when zero', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} pricePerPerson={0} />)
      expect(screen.queryByText(/osobę/)).not.toBeInTheDocument()
    })

    it('renders custom per-person label', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} pricePerPerson={200} pricePerPersonLabel="/ gościa" />)
      expect(screen.getByText(/gościa/)).toBeInTheDocument()
    })
  })

  describe('Flat line items', () => {
    it('renders line item labels', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} lineItems={makeLineItems()} />)
      expect(screen.getByText('Dania')).toBeInTheDocument()
      expect(screen.getByText('Usługi dodatkowe')).toBeInTheDocument()
    })

    it('renders line item amounts', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} lineItems={makeLineItems()} />)
      const prices = screen.getAllByText(/1\s*500|500/)
      expect(prices.length).toBeGreaterThan(0)
    })

    it('renders item detail when provided', () => {
      const items: FinancialLineItem[] = [
        { id: 'opt', label: 'Opcja menu', detail: '(10 × 50,00 zł)', amount: 500 },
      ]
      render(<UnifiedFinancialSummary totalPrice={500} lineItems={items} />)
      expect(screen.getByText(/Opcja menu/)).toBeInTheDocument()
      expect(screen.getByText('(10 × 50,00 zł)')).toBeInTheDocument()
    })
  })

  describe('Line groups with breakdown toggle', () => {
    it('shows breakdown toggle button with group total', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} />)
      expect(screen.getByText('Koszty usług')).toBeInTheDocument()
    })

    it('groups are collapsed by default (lineGroupsCollapsed=true)', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={true} />)
      expect(screen.queryByText('Pakiet gastronomiczny')).not.toBeInTheDocument()
    })

    it('groups are expanded when lineGroupsCollapsed=false', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={false} />)
      expect(screen.getByText('Pakiet gastronomiczny')).toBeInTheDocument()
    })

    it('clicking toggle expands groups', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={true} />)
      const toggleBtn = screen.getByText('Koszty usług').closest('button')!
      fireEvent.click(toggleBtn)
      expect(screen.getByText('Pakiet gastronomiczny')).toBeInTheDocument()
    })

    it('clicking toggle again collapses groups', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={false} />)
      const toggleBtn = screen.getByText('Koszty usług').closest('button')!
      fireEvent.click(toggleBtn)
      expect(screen.queryByText('Pakiet gastronomiczny')).not.toBeInTheDocument()
    })

    it('renders group items when expanded', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={false} />)
      expect(screen.getByText(/Dorośli/)).toBeInTheDocument()
      expect(screen.getByText(/Dzieci/)).toBeInTheDocument()
    })

    it('renders group subtotal when present', () => {
      render(<UnifiedFinancialSummary totalPrice={1900} lineGroups={makeLineGroups()} lineGroupsCollapsed={false} />)
      expect(screen.getByText('Suma')).toBeInTheDocument()
    })
  })

  describe('Discount', () => {
    it('shows discount info in total section when discount provided', () => {
      const discount: FinancialDiscount = { type: 'FIXED', amount: 200, reason: 'Stały klient' }
      render(<UnifiedFinancialSummary totalPrice={1800} discount={discount} />)
      expect(screen.getByText(/rabat/i)).toBeInTheDocument()
    })

    it('does not show discount text when discount is null', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} discount={null} />)
      expect(screen.queryByText(/w tym rabat/i)).not.toBeInTheDocument()
    })

    it('does not show discount text when discount amount is zero', () => {
      const discount: FinancialDiscount = { type: 'FIXED', amount: 0 }
      render(<UnifiedFinancialSummary totalPrice={2000} discount={discount} />)
      expect(screen.queryByText(/w tym rabat/i)).not.toBeInTheDocument()
    })

    it('renders discountSlot content', () => {
      render(
        <UnifiedFinancialSummary
          totalPrice={1800}
          discountSlot={<div data-testid="discount-slot">Discount UI</div>}
        />
      )
      expect(screen.getByTestId('discount-slot')).toBeInTheDocument()
    })
  })

  describe('Balance bar', () => {
    it('renders balance section when deposits exist', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance()} />)
      expect(screen.getByText('Stan rozliczeń')).toBeInTheDocument()
    })

    it('does not render balance when balance is null', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={null} />)
      expect(screen.queryByText('Stan rozliczeń')).not.toBeInTheDocument()
    })

    it('does not render balance when depositsCount is 0', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance({ depositsCount: 0 })} />)
      expect(screen.queryByText('Stan rozliczeń')).not.toBeInTheDocument()
    })

    it('shows percent paid in balance', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance({ percentPaid: 50 })} />)
      expect(screen.getByText(/Wpłacono \(50%\)/)).toBeInTheDocument()
    })

    it('shows remaining amount when not fully paid', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance({ remaining: 1000 })} />)
      expect(screen.getByText('Pozostało do zapłaty')).toBeInTheDocument()
    })

    it('shows fully paid message when remaining is 0', () => {
      render(
        <UnifiedFinancialSummary
          totalPrice={2000}
          balance={makeBalance({ remaining: 0, totalPaid: 2000, percentPaid: 100, percentCommitted: 100 })}
        />
      )
      expect(screen.getByText('Całkowicie opłacone!')).toBeInTheDocument()
    })

    it('shows pending amount when totalPending > 0', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance({ totalPending: 500 })} />)
      expect(screen.getByText(/Oczekuje/)).toBeInTheDocument()
    })

    it('does not show pending when totalPending is 0', () => {
      render(<UnifiedFinancialSummary totalPrice={2000} balance={makeBalance({ totalPending: 0 })} />)
      expect(screen.queryByText(/Oczekuje/)).not.toBeInTheDocument()
    })
  })

  describe('Slots', () => {
    it('renders depositsSlot content', () => {
      render(
        <UnifiedFinancialSummary
          totalPrice={2000}
          depositsSlot={<div data-testid="deposits-slot">Deposits list</div>}
        />
      )
      expect(screen.getByTestId('deposits-slot')).toBeInTheDocument()
    })

    it('renders headerAction slot', () => {
      render(
        <UnifiedFinancialSummary
          totalPrice={2000}
          headerAction={<button data-testid="header-action">Dodaj rabat</button>}
        />
      )
      expect(screen.getByTestId('header-action')).toBeInTheDocument()
    })
  })

  describe('Combined mode (groups + flat items)', () => {
    it('renders both groups and flat items when both provided', () => {
      render(
        <UnifiedFinancialSummary
          totalPrice={2400}
          lineGroups={makeLineGroups()}
          lineItems={makeLineItems()}
          lineGroupsCollapsed={false}
        />
      )
      // Toggle is shown for groups
      expect(screen.getByText('Koszty usług')).toBeInTheDocument()
    })
  })
})
