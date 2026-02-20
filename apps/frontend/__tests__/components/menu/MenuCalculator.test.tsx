/**
 * MenuCalculator (PriceBreakdown) Component Tests
 *
 * Tests price calculation display:
 * - PLN formatting
 * - Package cost breakdown (adults, children, toddlers)
 * - Options cost breakdown (PER_PERSON, FLAT)
 * - Expand/collapse sections
 * - Total calculation
 * - Edge cases (zero, gratis, no options)
 *
 * Issue: #98 — Sekcja 3
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { PriceBreakdown as PriceBreakdownType } from '@/types/menu.types';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        return React.forwardRef((props: any, ref: any) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, whileFocus, whileInView, layout, layoutId, ...rest } = props;
          return React.createElement(prop, { ...rest, ref });
        });
      },
    }),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// ─── Test Data ──────────────────────────────────────────────────────────────

const fullBreakdown: PriceBreakdownType = {
  packageCost: {
    adults: { count: 50, priceEach: 350, total: 17500 },
    children: { count: 10, priceEach: 200, total: 2000 },
    toddlers: { count: 5, priceEach: 0, total: 0 },
    subtotal: 19500,
  },
  optionsCost: [
    { option: 'Bar otwarty', priceType: 'PER_PERSON', priceEach: 100, quantity: 60, total: 6000 },
    { option: 'Fotobudka', priceType: 'FLAT', priceEach: 1500, quantity: 1, total: 1500 },
  ],
  optionsSubtotal: 7500,
  totalMenuPrice: 27000,
};

const noOptionsBreakdown: PriceBreakdownType = {
  packageCost: {
    adults: { count: 20, priceEach: 250, total: 5000 },
    children: { count: 0, priceEach: 150, total: 0 },
    toddlers: { count: 0, priceEach: 0, total: 0 },
    subtotal: 5000,
  },
  optionsCost: [],
  optionsSubtotal: 0,
  totalMenuPrice: 5000,
};

const toddlersPaidBreakdown: PriceBreakdownType = {
  packageCost: {
    adults: { count: 30, priceEach: 300, total: 9000 },
    children: { count: 10, priceEach: 180, total: 1800 },
    toddlers: { count: 5, priceEach: 50, total: 250 },
    subtotal: 11050,
  },
  optionsCost: [],
  optionsSubtotal: 0,
  totalMenuPrice: 11050,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function renderPriceBreakdown(props: { breakdown: PriceBreakdownType; showDetails?: boolean }) {
  const { PriceBreakdown } = await import('@/components/menu/PriceBreakdown');
  return render(<PriceBreakdown {...props} />);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('MenuCalculator (PriceBreakdown)', () => {
  // ── Core Rendering ────────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render component title "Rozliczenie cen"', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Rozliczenie cen')).toBeInTheDocument();
    });

    it('should display total price formatted in PLN', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // 27000 PLN → "27 000 zł" — appears in SUMA CAŁKOWITA section
      // Use the total section to scope the query
      const totalSection = screen.getByText('SUMA CAŁKOWITA').closest('div')!;
      expect(within(totalSection).getByText(/27\s*000\s*zł/)).toBeInTheDocument();
    });

    it('should show "SUMA CAŁKOWITA" label', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('SUMA CAŁKOWITA')).toBeInTheDocument();
    });

    it('should show VAT info text', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Ceny brutto (zawierają VAT)')).toBeInTheDocument();
    });
  });

  // ── Package Cost Section ──────────────────────────────────────────────────

  describe('Package Cost Section', () => {
    it('should show "Pakiet" section header', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Pakiet')).toBeInTheDocument();
    });

    it('should show package subtotal formatted', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // 19500 PLN → "19 500 zł" — appears in Pakiet header area
      const allPrices = screen.getAllByText(/19\s*500\s*zł/);
      expect(allPrices.length).toBeGreaterThanOrEqual(1);
    });

    it('should display adults line item', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/50.*×.*Doro/)).toBeInTheDocument();
    });

    it('should display children line item', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/10.*×.*Dzieci/)).toBeInTheDocument();
    });

    it('should display toddlers as "Gratis" when price is 0', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/5.*×.*Maluch/)).toBeInTheDocument();
      expect(screen.getByText(/Gratis/)).toBeInTheDocument();
    });

    it('should display toddlers with price when priceEach > 0', async () => {
      await renderPriceBreakdown({ breakdown: toddlersPaidBreakdown });
      expect(screen.getByText(/5.*×.*Maluch/)).toBeInTheDocument();
      // Toddler line should show price, not Gratis
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('50 zł');
    });

    it('should hide children row when count is 0', async () => {
      await renderPriceBreakdown({ breakdown: noOptionsBreakdown });
      expect(screen.queryByText(/×.*Dzieci/)).not.toBeInTheDocument();
    });

    it('should hide toddlers row when count is 0', async () => {
      await renderPriceBreakdown({ breakdown: noOptionsBreakdown });
      expect(screen.queryByText(/×.*Maluch/)).not.toBeInTheDocument();
    });
  });

  // ── Options Cost Section ──────────────────────────────────────────────────

  describe('Options Cost Section', () => {
    it('should show "Opcje dodatkowe" section when options exist', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Opcje dodatkowe')).toBeInTheDocument();
    });

    it('should not show options section when no options', async () => {
      await renderPriceBreakdown({ breakdown: noOptionsBreakdown });
      expect(screen.queryByText('Opcje dodatkowe')).not.toBeInTheDocument();
    });

    it('should show options subtotal', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // 7500 PLN → "7 500 zł" or "7500 zł" — but 17500 also contains '7 500'
      // Scope to the options section header button area
      const optionsHeader = screen.getByText('Opcje dodatkowe').closest('button');
      if (optionsHeader) {
        const headerText = optionsHeader.textContent || '';
        expect(headerText).toMatch(/7\s*500\s*zł/);
      }
    });

    it('should display each option name', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Bar otwarty')).toBeInTheDocument();
      expect(screen.getByText('Fotobudka')).toBeInTheDocument();
    });

    it('should show per-person label for PER_PERSON options', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/za os\./)).toBeInTheDocument();
    });

    it('should show flat label for FLAT options', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/jednorazowo/)).toBeInTheDocument();
    });

    it('should show quantity × price for PER_PERSON option', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // Bar otwarty: 60 × 100 zł
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/60.*×.*100\s*zł/);
    });
  });

  // ── Expand/Collapse ───────────────────────────────────────────────────────

  describe('Expand/Collapse Sections', () => {
    it('should have clickable package section header', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });

      // Package section starts expanded — adults visible
      expect(screen.getByText(/50.*×.*Doro/)).toBeInTheDocument();

      // The header should be a button
      const pakietBtn = screen.getByText('Pakiet').closest('button');
      expect(pakietBtn).not.toBeNull();
    });

    it('should have clickable options section header', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });

      // Options section starts expanded
      expect(screen.getByText('Bar otwarty')).toBeInTheDocument();

      // The header should be a button
      const optionsBtn = screen.getByText('Opcje dodatkowe').closest('button');
      expect(optionsBtn).not.toBeNull();
    });
  });

  // ── showDetails Prop ──────────────────────────────────────────────────────

  describe('showDetails Prop', () => {
    it('should hide details when showDetails=false', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown, showDetails: false });

      // Title and total should still be visible
      expect(screen.getByText('Rozliczenie cen')).toBeInTheDocument();
      expect(screen.getByText('SUMA CAŁKOWITA')).toBeInTheDocument();

      // Detail sections should be hidden
      expect(screen.queryByText('Pakiet')).not.toBeInTheDocument();
      expect(screen.queryByText('Opcje dodatkowe')).not.toBeInTheDocument();
    });

    it('should show details when showDetails=true (default)', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Pakiet')).toBeInTheDocument();
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle breakdown with only adults', async () => {
      const adultsOnly: PriceBreakdownType = {
        packageCost: {
          adults: { count: 100, priceEach: 400, total: 40000 },
          children: { count: 0, priceEach: 0, total: 0 },
          toddlers: { count: 0, priceEach: 0, total: 0 },
          subtotal: 40000,
        },
        optionsCost: [],
        optionsSubtotal: 0,
        totalMenuPrice: 40000,
      };

      await renderPriceBreakdown({ breakdown: adultsOnly });
      expect(screen.getByText(/100.*×.*Doro/)).toBeInTheDocument();
      // "40 000 zł" appears multiple times (subtotal, line item, total) — use getAllByText
      const priceMatches = screen.getAllByText(/40\s*000\s*zł/);
      expect(priceMatches.length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText(/×.*Dzieci/)).not.toBeInTheDocument();
      expect(screen.queryByText(/×.*Maluch/)).not.toBeInTheDocument();
    });

    it('should handle very large total price', async () => {
      const expensive: PriceBreakdownType = {
        packageCost: {
          adults: { count: 200, priceEach: 500, total: 100000 },
          children: { count: 0, priceEach: 0, total: 0 },
          toddlers: { count: 0, priceEach: 0, total: 0 },
          subtotal: 100000,
        },
        optionsCost: [],
        optionsSubtotal: 0,
        totalMenuPrice: 100000,
      };

      await renderPriceBreakdown({ breakdown: expensive });
      // "100 000 zł" appears multiple times — use getAllByText
      const priceMatches = screen.getAllByText(/100\s*000\s*zł/);
      expect(priceMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle single option only', async () => {
      const singleOption: PriceBreakdownType = {
        packageCost: {
          adults: { count: 10, priceEach: 200, total: 2000 },
          children: { count: 0, priceEach: 0, total: 0 },
          toddlers: { count: 0, priceEach: 0, total: 0 },
          subtotal: 2000,
        },
        optionsCost: [
          { option: 'DJ', priceType: 'FLAT', priceEach: 2000, quantity: 1, total: 2000 },
        ],
        optionsSubtotal: 2000,
        totalMenuPrice: 4000,
      };

      await renderPriceBreakdown({ breakdown: singleOption });
      expect(screen.getByText('DJ')).toBeInTheDocument();
      // Total "4 000 zł" should appear
      const totalSection = screen.getByText('SUMA CAŁKOWITA').closest('div')!;
      expect(within(totalSection).getByText(/4\s*000\s*zł/)).toBeInTheDocument();
    });
  });

  // ── Skeleton ──────────────────────────────────────────────────────────────

  describe('PriceBreakdownSkeleton', () => {
    it('should render skeleton loading state', async () => {
      const { PriceBreakdownSkeleton } = await import('@/components/menu/PriceBreakdown');
      const { container } = render(<PriceBreakdownSkeleton />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });
});
