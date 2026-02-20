/**
 * MenuConfigurator (MenuSelectionFlow) Component Tests
 *
 * Tests the 4-step menu selection wizard:
 * Step 1: Template selection
 * Step 2: Package selection
 * Step 3: Dish selection
 * Step 4: Options (extras)
 *
 * Issue: #98 — Sekcja 3
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

const mockOptions = [
  {
    id: 'opt-1',
    name: 'Bar otwarty',
    description: 'Nielimitowany alkohol',
    category: 'Alkohol',
    priceType: 'PER_PERSON' as const,
    priceAmount: 100,
    allowMultiple: false,
    maxQuantity: 1,
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'opt-2',
    name: 'Fotobudka',
    description: 'Fotobudka na wydarzenie',
    category: 'Rozrywka',
    priceType: 'FLAT' as const,
    priceAmount: 1500,
    allowMultiple: false,
    maxQuantity: 1,
    isActive: true,
    displayOrder: 2,
  },
];

// Mock hooks
const mockUseMenuTemplates = vi.fn();
const mockUseMenuPackages = vi.fn();
const mockUseMenuPackage = vi.fn();
const mockUseMenuOptions = vi.fn();

vi.mock('@/hooks/use-menu', () => ({
  useMenuTemplates: (...args: any[]) => mockUseMenuTemplates(...args),
  useMenuPackages: (...args: any[]) => mockUseMenuPackages(...args),
  useMenuPackage: (...args: any[]) => mockUseMenuPackage(...args),
  useMenuOptions: (...args: any[]) => mockUseMenuOptions(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
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

vi.mock('@/components/menu/OptionsSelector', () => ({
  OptionsSelector: ({ options, quantities, onQuantityChange }: any) => (
    <div data-testid="options-selector">
      {options.map((opt: any) => (
        <div key={opt.id} data-testid={`option-${opt.id}`}>
          <span>{opt.name}</span>
          <button
            data-testid={`option-add-${opt.id}`}
            onClick={() => onQuantityChange(opt.id, (quantities[opt.id] || 0) + 1)}
          >
            +
          </button>
        </div>
      ))}
    </div>
  ),
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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    children: 10,
    toddlers: 5,
    onComplete: vi.fn(),
  };

  return render(<MenuSelectionFlow {...defaultProps} {...props} />, {
    wrapper: createWrapper(),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MenuConfigurator (MenuSelectionFlow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMenuTemplates.mockReturnValue({ data: mockTemplates, isLoading: false });
    mockUseMenuPackages.mockReturnValue({ data: mockPackages, isLoading: false });
    mockUseMenuPackage.mockReturnValue({ data: undefined, isLoading: false });
    mockUseMenuOptions.mockReturnValue({ data: mockOptions, isLoading: false });
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  describe('Initial Render', () => {
    it('should render guest info banner with correct counts', async () => {
      await renderConfigurator();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('dorosłych')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('dzieci')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('maluchów')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument(); // totalGuests
      expect(screen.getByText('razem')).toBeInTheDocument();
    });

    it('should render 4 step indicators', async () => {
      await renderConfigurator();
      expect(screen.getByText('Wybór Menu')).toBeInTheDocument();
      expect(screen.getByText('Pakiet')).toBeInTheDocument();
      expect(screen.getByText('Dania')).toBeInTheDocument();
      expect(screen.getByText('Dodatki')).toBeInTheDocument();
    });

    it('should start at template step', async () => {
      await renderConfigurator();
      expect(screen.getByText('Wybierz Menu')).toBeInTheDocument();
      expect(screen.getByText('Dostosowane do Twojego wydarzenia')).toBeInTheDocument();
    });

    it('should show loading skeletons when templates are loading', async () => {
      mockUseMenuTemplates.mockReturnValue({ data: undefined, isLoading: true });
      await renderConfigurator();
      const skeletons = screen.getAllByTestId('menu-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('should show empty state when no templates available', async () => {
      mockUseMenuTemplates.mockReturnValue({ data: [], isLoading: false });
      await renderConfigurator();
      expect(screen.getByText('Brak dostępnych menu')).toBeInTheDocument();
    });
  });

  // ── Template Step ─────────────────────────────────────────────────────

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
        expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument();
      });
    });

    it('should show template name in package step subtitle', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      await user.click(screen.getByTestId('menu-card-tmpl-1'));

      await waitFor(() => {
        expect(screen.getByText(/Menu Weselne/)).toBeInTheDocument();
      });
    });

    it('should pass eventTypeId filter to useMenuTemplates', async () => {
      await renderConfigurator({ eventTypeId: 'evt-1' });
      expect(mockUseMenuTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ eventTypeId: 'evt-1', isActive: true })
      );
    });
  });

  // ── Package Step ──────────────────────────────────────────────────────

  describe('Step 2: Package Selection', () => {
    async function goToPackageStep() {
      const user = userEvent.setup();
      await renderConfigurator();
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => {
        expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument();
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
      const skeletons = screen.getAllByTestId('package-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('should show empty state when no packages available', async () => {
      mockUseMenuPackages.mockReturnValue({ data: [], isLoading: false });
      await goToPackageStep();
      expect(screen.getByText('Brak dostępnych pakietów')).toBeInTheDocument();
    });

    it('should have "Zmień menu" button to go back', async () => {
      const user = await goToPackageStep();
      const changeBtn = screen.getByText('Zmień menu');
      expect(changeBtn).toBeInTheDocument();

      await user.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText('Wybierz Menu')).toBeInTheDocument();
      });
    });

    it('should advance to dishes step after selecting package', async () => {
      const user = await goToPackageStep();
      await user.click(screen.getByTestId('package-card-pkg-1'));

      await waitFor(() => {
        expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
      });
    });

    it('should reset package and dishes when changing template', async () => {
      const user = await goToPackageStep();
      // Select package first
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => {
        expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
      });

      // Navigate back to template via step indicator click
      await user.click(screen.getByText('Wybór Menu'));
      await waitFor(() => {
        expect(screen.getByText('Wybierz Menu')).toBeInTheDocument();
      });

      // Select different template
      await user.click(screen.getByTestId('menu-card-tmpl-2'));
      await waitFor(() => {
        expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument();
      });
    });
  });

  // ── Dishes Step ───────────────────────────────────────────────────────

  describe('Step 3: Dish Selection', () => {
    async function goToDishesStep() {
      const user = userEvent.setup();
      await renderConfigurator();
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument());
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      return user;
    }

    it('should render DishSelector component', async () => {
      await goToDishesStep();
      expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
    });

    it('should show step header with package name', async () => {
      await goToDishesStep();
      expect(screen.getByText('Wybór Dań')).toBeInTheDocument();
      expect(screen.getByText('Pakiet Gold')).toBeInTheDocument();
    });

    it('should advance to options step when dishes completed', async () => {
      const user = await goToDishesStep();
      await user.click(screen.getByTestId('dish-complete'));

      await waitFor(() => {
        expect(screen.getByText('Opcje Dodatkowe')).toBeInTheDocument();
      });
    });

    it('should go back to package step via DishSelector back button', async () => {
      const user = await goToDishesStep();
      await user.click(screen.getByTestId('dish-back'));

      await waitFor(() => {
        expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument();
      });
    });
  });

  // ── Options Step ──────────────────────────────────────────────────────

  describe('Step 4: Options', () => {
    async function goToOptionsStep() {
      const user = userEvent.setup();
      await renderConfigurator();
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument());
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      await user.click(screen.getByTestId('dish-complete'));
      await waitFor(() => expect(screen.getByText('Opcje Dodatkowe')).toBeInTheDocument());
      return user;
    }

    it('should render OptionsSelector with available options', async () => {
      await goToOptionsStep();
      expect(screen.getByTestId('options-selector')).toBeInTheDocument();
      expect(screen.getByTestId('option-opt-1')).toBeInTheDocument();
      expect(screen.getByTestId('option-opt-2')).toBeInTheDocument();
    });

    it('should show "Zatwierdź wybór" button', async () => {
      await goToOptionsStep();
      const confirmButtons = screen.getAllByText('Zatwierdź wybór');
      expect(confirmButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "Wstecz" button to go back to dishes', async () => {
      const user = await goToOptionsStep();
      await user.click(screen.getByText('Wstecz'));

      await waitFor(() => {
        expect(screen.getByTestId('dish-selector')).toBeInTheDocument();
      });
    });

    it('should call onComplete with correct data when confirming', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      const { MenuSelectionFlow } = await import('@/components/menu/MenuSelectionFlow');

      render(
        <MenuSelectionFlow adults={50} children={10} toddlers={5} onComplete={onComplete} />,
        { wrapper: createWrapper() }
      );

      // Navigate through all steps
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument());
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      await user.click(screen.getByTestId('dish-complete'));
      await waitFor(() => expect(screen.getByText('Opcje Dodatkowe')).toBeInTheDocument());

      // Add an option
      await user.click(screen.getByTestId('option-add-opt-1'));

      // Confirm
      const confirmButtons = screen.getAllByText('Zatwierdź wybór');
      await user.click(confirmButtons[0]);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            templateId: 'tmpl-1',
            packageId: 'pkg-1',
            adults: 50,
            children: 10,
            toddlers: 5,
            dishSelections: expect.any(Array),
            selectedOptions: expect.arrayContaining([
              expect.objectContaining({ optionId: 'opt-1', quantity: 1 }),
            ]),
          })
        );
      });
    });

    it('should call onComplete with empty options when none selected', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      const { MenuSelectionFlow } = await import('@/components/menu/MenuSelectionFlow');

      render(
        <MenuSelectionFlow adults={20} children={0} toddlers={0} onComplete={onComplete} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument());
      await user.click(screen.getByTestId('package-card-pkg-1'));
      await waitFor(() => expect(screen.getByTestId('dish-selector')).toBeInTheDocument());
      await user.click(screen.getByTestId('dish-complete'));
      await waitFor(() => expect(screen.getByText('Opcje Dodatkowe')).toBeInTheDocument());

      const confirmButtons = screen.getAllByText('Zatwierdź wybór');
      await user.click(confirmButtons[0]);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedOptions: [],
          })
        );
      });
    });
  });

  // ── Step Navigation ───────────────────────────────────────────────────

  describe('Step Navigation', () => {
    it('should not allow skipping to package step without template', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      // Click on "Pakiet" step indicator — should not navigate
      await user.click(screen.getByText('Pakiet'));

      // Should still be on template step
      expect(screen.getByText('Wybierz Menu')).toBeInTheDocument();
    });

    it('should allow clicking back to completed steps', async () => {
      const user = userEvent.setup();
      await renderConfigurator();

      // Go to package step
      await user.click(screen.getByTestId('menu-card-tmpl-1'));
      await waitFor(() => expect(screen.getByText('Wybierz Pakiet')).toBeInTheDocument());

      // Click back to template step via step indicator
      await user.click(screen.getByText('Wybór Menu'));

      await waitFor(() => {
        expect(screen.getByText('Wybierz Menu')).toBeInTheDocument();
      });
    });
  });

  // ── Edit Mode (initialSelection) ──────────────────────────────────────

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

      expect(screen.getByText('Ładowanie wybranego menu...')).toBeInTheDocument();
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
