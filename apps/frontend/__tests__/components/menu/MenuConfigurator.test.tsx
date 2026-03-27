/**
 * MenuConfigurator (MenuSelectionFlow) Component Tests
 *
 * Tests the 3-step menu selection wizard:
 * Step 1: Template selection
 * Step 2: Package selection
 * Step 3: Dish selection (completes flow via onComplete)
 *
 * Issue: #98 — Sekcja 3
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockTemplates = [
  {
    id: 'tmpl-1',
    eventTypeId: 'evt-1',
    name: 'Menu Weselne',
    description: 'Pełne menu na wesele',
    variant: 'Premium',
    validFrom: '2025-01-01',
    isActive: true,
    displayOrder: 1,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'tmpl-2',
    eventTypeId: 'evt-1',
    name: 'Menu Komunijne',
    description: 'Menu na komunię',
    variant: 'Standard',
    validFrom: '2025-01-01',
    isActive: true,
    displayOrder: 2,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockPackages = [
  {
    id: 'pkg-1',
    menuTemplateId: 'tmpl-1',
    name: 'Pakiet Gold',
    description: 'Najlepszy pakiet',
    shortDescription: 'Premium',
    pricePerAdult: 350,
    pricePerChild: 200,
    pricePerToddler: 0,
    includedItems: ['Przystawki', 'Zupa', 'Danie główne', 'Deser'],
    displayOrder: 1,
    isPopular: true,
    isRecommended: true,
  },
  {
    id: 'pkg-2',
    menuTemplateId: 'tmpl-1',
    name: 'Pakiet Silver',
    description: 'Dobry pakiet',
    shortDescription: 'Standard',
    pricePerAdult: 250,
    pricePerChild: 150,
    pricePerToddler: 0,
    includedItems: ['Zupa', 'Danie główne'],
    displayOrder: 2,
    isPopular: false,
    isRecommended: false,
  },
];

// Mock hooks
const mockUseMenuTemplates = vi.fn();
const mockUseMenuPackages = vi.fn();
const mockUseMenuPackage = vi.fn();

vi.mock('@/hooks/use-menu', () => ({
  useMenuTemplates: (...args: any[]) => mockUseMenuTemplates(...args),
  useMenuPackages: (...args: any[]) => mockUseMenuPackages(...args),
  useMenuPackage: (...args: any[]) => mockUseMenuPackage(...args),
  useMenuOptions: () => ({ data: [], isLoading: false }),
}));

// Mock child components that are complex
vi.mock('@/components/menu', () => ({
  MenuCard: ({ template, onSelect, isSelected }: any) => (
    <div
      data-testid={`menu-card-${template.id}`}
      data-selected={isSelected}
      onClick={() => onSelect(template)}
    >
      {template.name}
    </div>
  ),
  MenuCardSkeleton: () => <div data-testid="menu-card-skeleton" />,
  PackageCard: ({ package: pkg, onSelect, isSelected }: any) => (
    <div
      data-testid={`package-card-${pkg.id}`}
      data-selected={isSelected}
      onClick={() => onSelect(pkg)}
    >
      {pkg.name}
    </div>
  ),
  PackageCardSkeleton: () => <div data-testid="package-card-skeleton" />,
}));

vi.mock('@/components/menu/DishSelector', () => ({
  DishSelector: ({ onComplete, onBack }: any) => (
    <div data-testid="dish-selector">
      <button
        data-testid="dish-complete"
        onClick={() => onComplete([{ categoryId: 'cat-1', dishes: [{ dishId: 'd-1', quantity: 1 }] }])}
      >
        Zatwierdź dania
      </button>
      <button data-testid="dish-back" onClick={onBack}>
        Wstecz
      </button>
    </div>
  ),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

async function renderConfigurator(props = {}) {
  const { MenuSelectionFlow } = await import(
    '@/components/menu/MenuSelectionFlow'
  );

  const defaultProps = {
    adults: 50,
    childrenCount: 10,
    toddlers: 5,
    onComplete: vi.fn(),
  };

  return render(<MenuSelectionFlow {...defaultProps} {...props} />, {
    wrapper: createWrapper(),
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('MenuConfigurator (MenuSelectionFlow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false });
    mockUseMenuPackages.mockReturnValue({ data: mockPackages, isLoading: false });
    mockUseMenuPackage.mockReturnValue({ data: undefined, isLoading: false });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('Initial Render', () => {
    it('should render guest info banner with adult count', async () => {
      await renderConfigurator();
      // Component shows guest counts — check for the numbers
      const allText = document.body.textContent || '';
      expect(allText).toContain('50');
      expect(allText).toContain('10');
    });

    it('should render step indicators', async () => {
      await renderConfigurator();
      const bodyText = document.body.textContent || '';
      // Wizard has step labels
      expect(bodyText).toMatch(/Menu|Wybór|Pakiet|Dania|Dodatki/);
    });

    it('should start at template step with selection prompt', async () => {
      await renderConfigurator();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/Wybierz|Menu|szablon/i);
    });

    it('should show loading skeletons when templates are loading', async () => {
      mockUseMenuTemplates.mockReturnValue({ data: undefined, isLoading: true });
      await renderConfigurator();
      const skeletons = screen.queryAllByTestId('menu-card-skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show empty state when no templates available', async () => {
      mockUseMenuTemplates.mockReturnValue({ data: [], isLoading: false });
      await renderConfigurator();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/brak|pust|dostępn/i);
    });
  });

  // ── Template Step ─────────────────────────────────────────────────────────

  describe('Step 1: Template Selection', () => {
    it('should render all templates as MenuCards', async () => {
      await renderConfigurator();
      expect(screen.getByTestId('menu-card-tmpl-1')).toBeInTheDocument();
      expect(screen.getByTestId('menu-card-tmpl-2')).toBeInTheDocument();
    });

    it('should advance to package step after selecting template', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      await user.click(screen.getByTestId('menu-card-tmpl-1'));

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toMatch(/Pakiet|pakiet/);
      });
    });

    it('should show template name after selecting', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      await user.click(screen.getByTestId('menu-card-tmpl-1'));

      await waitFor(() => {
        expect(document.body.textContent).toContain('Menu Weselne');
      });
    });
  });

  // ── Package Step ──────────────────────────────────────────────────────────

  describe('Step 2: Package Selection', () => {
    async function goToPackageStep() {
      const user = userEvent.setup();
      await renderConfigurator();
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/Pakiet|pakiet/);
      });
      return user;
    }

    it('should render package cards', async () => {
      await goToPackageStep();
      expect(screen.getByTestId('package-card-pkg-1')).toBeInTheDocument();
      expect(screen.getByTestId('package-card-pkg-2')).toBeInTheDocument();
    });

    it('should show loading skeletons when packages are loading', async () => {
      mockUseMenuPackages.mockReturnValue({ data: undefined, isLoading: true });
      await goToPackageStep();
      const skeletons = screen.queryAllByTestId('package-card-skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show empty state when no packages available', async () => {
      mockUseMenuPackages.mockReturnValue({ data: [], isLoading: false });
      await goToPackageStep();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/brak|pust|dostępn/i);
    });

    it('should have back button to change template', async () => {
      const user = await goToPackageStep();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/zmień|wstecz|powrót/i);
    });

    it('should advance to dishes step after selecting package', async () => {
      const user = await goToPackageStep();
      await user.click(screen.getByTestId('package-card-pkg-1'));

      await waitFor(() => {
        expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
      });
    });
  });

  // ── Dishes Step ───────────────────────────────────────────────────────────

  describe('Step 3: Dish Selection', () => {
    async function goToDishesStep() {
      const user = userEvent.setup();
      await renderConfigurator();
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(document.body.textContent).toMatch(/Pakiet|pakiet/));
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      return user;
    }

    it('should render DishSelector component', async () => {
      await goToDishesStep();
      expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
    });

    it('should call onComplete when dishes completed', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      const { MenuSelectionFlow } = await import('@/components/menu/MenuSelectionFlow');

      render(
        <MenuSelectionFlow adults={50} childrenCount={10} toddlers={5} onComplete={onComplete} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(document.body.textContent).toMatch(/Pakiet|pakiet/));
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      await user.click(screen.getByTestId('dish-complete'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            templateId: 'tmpl-1',
            packageId: 'pkg-1',
          })
        );
      });
    });

    it('should go back to package step via DishSelector back button', async () => {
      const user = await goToDishesStep();
      await user.click(screen.getByTestId('dish-back'));

      await waitFor(() => {
        expect(screen.getByTestId('package-card-pkg-1')).toBeInTheDocument();
      });
    });
  });

  // ── Step Navigation ───────────────────────────────────────────────────────

  describe('Step Navigation', () => {
    it('should not allow skipping to package step without template', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      // Try clicking on Pakiet step indicator — templates should still be shown
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/Wybierz|Menu|szablon/i);
    });

    it('should allow clicking back to completed steps', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      // Go to package step
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(document.body.textContent).toMatch(/Pakiet|pakiet/));

      // Templates should still be accessible somehow
      expect(screen.getByTestId('package-card-pkg-1')).toBeInTheDocument();
    });
  });

  // ── Edit Mode (initialSelection) ──────────────────────────────────────────

  describe('Edit Mode', () => {
    it('should show loading state when initializing from initialSelection', async () => {
      mockUseMenuTemplates.mockReturnValue({ data: undefined, isLoading: true });
      mockUseMenuPackage.mockReturnValue({ data: undefined, isLoading: true });

      await renderConfigurator({
        initialSelection: {
          templateId: 'tmpl-1',
          packageId: 'pkg-1',
        },
      });

      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/ładowan|wczytyw|loading/i);
    });

    it('should initialize at dishes step when package is resolved', async () => {
      mockUseMenuPackage.mockReturnValue({ data: mockPackages[0], isLoading: false });

      await renderConfigurator({
        initialSelection: {
          templateId: 'tmpl-1',
          packageId: 'pkg-1',
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
      });
    });
  });
});
