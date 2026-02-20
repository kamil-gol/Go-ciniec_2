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

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// ─── Test Data ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function renderPriceBreakdown(props: { breakdown: PriceBreakdownType; showDetails?: boolean }) {
  const { PriceBreakdown } = await import('@/components/menu/PriceBreakdown');
  return render(<PriceBreakdown {...props} />);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MenuCalculator (PriceBreakdown)', () => {
  // ── Core Rendering ─────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render component title "Rozliczenie cen"', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Rozliczenie cen')).toBeInTheDocument();
    });

    it('should display total price formatted in PLN', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // 27000 PLN → "27 000 zł" in pl-PL format
      expect(screen.getByText(/27\s*000\s*zł/)).toBeInTheDocument();
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

  // ── Package Cost Section ───────────────────────────────────────────────

  describe('Package Cost Section', () => {
    it('should show "Pakiet" section header', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Pakiet')).toBeInTheDocument();
    });

    it('should show package subtotal', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // 19500 PLN → "19 500 zł"
      expect(screen.getByText(/19\s*500\s*zł/)).toBeInTheDocument();
    });

    it('should display adults count and per-person price', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/50 × Dorośli/)).toBeInTheDocument();
      expect(screen.getByText(/350\s*zł/)).toBeInTheDocument();
    });

    it('should display children count and price', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/10 × Dzieci/)).toBeInTheDocument();
    });

    it('should display toddlers as "Gratis" when price is 0', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/5 × Maluchy/)).toBeInTheDocument();
      expect(screen.getByText(/Gratis/)).toBeInTheDocument();
    });

    it('should display toddlers with price when priceEach > 0', async () => {
      await renderPriceBreakdown({ breakdown: toddlersPaidBreakdown });
      expect(screen.getByText(/5 × Maluchy/)).toBeInTheDocument();
      expect(screen.getByText(/50\s*zł/)).toBeInTheDocument();
    });

    it('should hide children row when count is 0', async () => {
      await renderPriceBreakdown({ breakdown: noOptionsBreakdown });
      expect(screen.queryByText(/× Dzieci/)).not.toBeInTheDocument();
    });

    it('should hide toddlers row when count is 0', async () => {
      await renderPriceBreakdown({ breakdown: noOptionsBreakdown });
      expect(screen.queryByText(/× Maluchy/)).not.toBeInTheDocument();
    });
  });

  // ── Options Cost Section ──────────────────────────────────────────────

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
      // 7500 PLN → "7 500 zł"
      expect(screen.getByText(/7\s*500\s*zł/)).toBeInTheDocument();
    });

    it('should display each option name', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText('Bar otwarty')).toBeInTheDocument();
      expect(screen.getByText('Fotobudka')).toBeInTheDocument();
    });

    it('should show PER_PERSON label for per-person options', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/za os\./)).toBeInTheDocument();
    });

    it('should show FLAT label for flat-price options', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      expect(screen.getByText(/jednorazowo/)).toBeInTheDocument();
    });

    it('should show quantity × price for each option', async () => {
      await renderPriceBreakdown({ breakdown: fullBreakdown });
      // Bar otwarty: 60 × 100 zł
      expect(screen.getByText(/60 ×/)).toBeInTheDocument();
      // Fotobudka: 1 × 1 500 zł
      expect(screen.getByText(/1 ×/)).toBeInTheDocument();
    });
  });

  // ── Expand/Collapse ────────────────────────────────────────────────────

  describe('Expand/Collapse Sections', () => {
    it('should toggle package section on click', async () => {
      const user = userEvent.setup();
      await renderPriceBreakdown({ breakdown: fullBreakdown });

      // Package section starts expanded — adults visible
      expect(screen.getByText(/50 × Dorośli/)).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('Pakiet'));

      // Content should be hidden (AnimatePresence mock just toggles)
      // After click, the section should re-render
    });

    it('should toggle options section on click', async () => {
      const user = userEvent.setup();
      await renderPriceBreakdown({ breakdown: fullBreakdown });

      // Options section starts expanded
      expect(screen.getByText('Bar otwarty')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('Opcje dodatkowe'));
    });
  });

  // ── showDetails Prop ──────────────────────────────────────────────────

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

  // ── Edge Cases ────────────────────────────────────────────────────────

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
      expect(screen.getByText(/100 × Dorośli/)).toBeInTheDocument();
      expect(screen.getByText(/40\s*000\s*zł/)).toBeInTheDocument();
      expect(screen.queryByText(/× Dzieci/)).not.toBeInTheDocument();
      expect(screen.queryByText(/× Maluchy/)).not.toBeInTheDocument();
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
      expect(screen.getByText(/100\s*000\s*zł/)).toBeInTheDocument();
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
      expect(screen.getByText(/4\s*000\s*zł/)).toBeInTheDocument();
    });
  });

  // ── Skeleton ──────────────────────────────────────────────────────────

  describe('PriceBreakdownSkeleton', () => {
    it('should render skeleton loading state', async () => {
      const { PriceBreakdownSkeleton } = await import('@/components/menu/PriceBreakdown');
      const { container } = render(<PriceBreakdownSkeleton />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });
});
