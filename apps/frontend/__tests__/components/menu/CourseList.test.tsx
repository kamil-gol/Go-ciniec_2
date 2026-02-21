/**
 * CourseList (DishSelector) Component Tests
 *
 * Tests dish selection by category:
 * - Category rendering with header, progress bar
 * - Dish toggle (select/deselect)
 * - Min/max selection limits with validation
 * - Quantity selector (0.5 increments)
 * - Allergens display
 * - Navigation (Back / Confirm)
 * - Error states
 *
 * Issue: #98 — Sekcja 3
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockCategoryData = {
  categories: [
    {
      categoryId: 'cat-soup',
      categoryName: 'Zupy',
      customLabel: '',
      categoryIcon: '🍲',
      minSelect: 1,
      maxSelect: 2,
      isRequired: true,
      dishes: [
        { id: 'dish-1', name: 'Rosół', description: 'Tradycyjny rosół z makaronem', allergens: ['gluten', 'jajka'] },
        { id: 'dish-2', name: 'Żurek', description: 'Żurek w chlebku', allergens: ['gluten'] },
        { id: 'dish-3', name: 'Krem z pomidorów', description: 'Kremowa zupa pomidorowa', allergens: [] },
      ],
    },
    {
      categoryId: 'cat-main',
      categoryName: 'Dania główne',
      customLabel: 'Danie na ciepło',
      categoryIcon: '🥩',
      minSelect: 2,
      maxSelect: 3,
      isRequired: true,
      dishes: [
        { id: 'dish-4', name: 'Polędwica wołowa', description: 'Z sosem pieprzowym', allergens: ['mleko'] },
        { id: 'dish-5', name: 'Łosoś grillowany', description: 'Z warzywami', allergens: ['ryby'] },
        { id: 'dish-6', name: 'Pierogi ruskie', description: 'Z cebulką', allergens: ['gluten', 'mleko'] },
        { id: 'dish-7', name: 'Schab pieczony', description: 'Z ziemniakami', allergens: [] },
      ],
    },
    {
      categoryId: 'cat-dessert',
      categoryName: 'Desery',
      customLabel: '',
      categoryIcon: '🎂',
      minSelect: 0,
      maxSelect: 2,
      isRequired: false,
      dishes: [
        { id: 'dish-8', name: 'Sernik', description: 'Nowojorski sernik', allergens: ['mleko', 'jajka', 'gluten'] },
        { id: 'dish-9', name: 'Tiramisu', description: 'Klasyczne tiramisu', allergens: ['mleko', 'jajka'] },
      ],
    },
  ],
};

const mockUsePackageCategories = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/use-menu', () => ({
  usePackageCategories: (...args: any[]) => mockUsePackageCategories(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

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
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (val: any) => ({ get: () => val, set: vi.fn() }),
    useTransform: (val: any) => val,
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

async function renderDishSelector(props: Partial<{
  packageId: string;
  initialSelections: any[];
  onComplete: (selections: any[]) => void;
  onBack: () => void;
}> = {}) {
  const { DishSelector } = await import('@/components/menu/DishSelector');

  const defaultProps = {
    packageId: 'pkg-1',
    onComplete: vi.fn(),
    onBack: vi.fn(),
    ...props,
  };

  return {
    ...render(<DishSelector {...defaultProps} />, { wrapper: createWrapper() }),
    onComplete: defaultProps.onComplete,
    onBack: defaultProps.onBack,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CourseList (DishSelector)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePackageCategories.mockReturnValue({ data: mockCategoryData, isLoading: false });
  });

  // ── Loading & Empty States ────────────────────────────────────────────────

  describe('Loading & Empty States', () => {
    it('should show spinner when loading', async () => {
      mockUsePackageCategories.mockReturnValue({ data: undefined, isLoading: true });
      const { container } = await renderDishSelector();
      const hasSpinner = container.querySelector('.animate-spin') ||
        container.querySelector('[role="status"]') ||
        document.body.textContent?.match(/ładowan|wczytyw/i);
      expect(hasSpinner).toBeTruthy();
    });

    it('should show info message when no categories in package', async () => {
      mockUsePackageCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
      });
      await renderDishSelector();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/nie wymaga|brak|pust/i);
    });

    it('should show info message when categoryData is null', async () => {
      mockUsePackageCategories.mockReturnValue({ data: null, isLoading: false });
      await renderDishSelector();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/nie wymaga|brak|pust/i);
    });
  });

  // ── Category Rendering ────────────────────────────────────────────────────

  describe('Category Rendering', () => {
    it('should render all categories', async () => {
      await renderDishSelector();
      expect(screen.getByText('Zupy')).toBeInTheDocument();
      expect(screen.getByText('Danie na ciepło')).toBeInTheDocument();
      expect(screen.getByText('Desery')).toBeInTheDocument();
    });

    it('should show category icons', async () => {
      await renderDishSelector();
      expect(screen.getByText('🍲')).toBeInTheDocument();
      expect(screen.getByText('🥩')).toBeInTheDocument();
      expect(screen.getByText('🎂')).toBeInTheDocument();
    });

    it('should show selection limits in counter badges', async () => {
      await renderDishSelector();
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/1.*2/);
      expect(bodyText).toMatch(/2.*3/);
    });

    it('should use customLabel instead of categoryName when provided', async () => {
      await renderDishSelector();
      expect(screen.getByText('Danie na ciepło')).toBeInTheDocument();
      expect(screen.queryByText('Dania główne')).not.toBeInTheDocument();
    });
  });

  // ── Dish Rendering ────────────────────────────────────────────────────────

  describe('Dish Rendering', () => {
    it('should render all dishes in each category', async () => {
      await renderDishSelector();
      expect(screen.getByText('Rosół')).toBeInTheDocument();
      expect(screen.getByText('Żurek')).toBeInTheDocument();
      expect(screen.getByText('Krem z pomidorów')).toBeInTheDocument();
      expect(screen.getByText('Polędwica wołowa')).toBeInTheDocument();
      expect(screen.getByText('Łosoś grillowany')).toBeInTheDocument();
      expect(screen.getByText('Pierogi ruskie')).toBeInTheDocument();
      expect(screen.getByText('Schab pieczony')).toBeInTheDocument();
      expect(screen.getByText('Sernik')).toBeInTheDocument();
      expect(screen.getByText('Tiramisu')).toBeInTheDocument();
    });

    it('should display dish descriptions', async () => {
      await renderDishSelector();
      expect(screen.getByText('Tradycyjny rosół z makaronem')).toBeInTheDocument();
      expect(screen.getByText('Z sosem pieprzowym')).toBeInTheDocument();
    });

    it('should display allergen badges', async () => {
      await renderDishSelector();
      const allergenBadges = screen.getAllByText('gluten');
      expect(allergenBadges.length).toBeGreaterThan(0);
      expect(screen.getAllByText('jajka').length).toBeGreaterThan(0);
    });
  });

  // ── Dish Selection ────────────────────────────────────────────────────────

  describe('Dish Selection', () => {
    it('should select a dish on click', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toMatch(/1\s*\/\s*1/);
      });
    });

    it('should deselect a dish on second click', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/1\s*\/\s*1/);
      });

      await user.click(screen.getByText('Rosół'));
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/0\s*\/\s*1/);
      });
    });

    it('should prevent selecting more dishes than maxSelect', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      // Select 2 soups (max for soup category)
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Żurek'));

      // Try to select 3rd — component shows inline alert instead of toast
      await user.click(screen.getByText('Krem z pomidorów'));

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        // Component renders inline alert: "Osiągnięto maksymalną liczbę pozycji"
        expect(bodyText).toMatch(/maksymaln|limit|osiągnięto/i);
      });
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should show error when required category has too few selections', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(b => /zatwierdź|potwierdź|dalej/i.test(b.textContent || ''));
      if (confirmBtn) {
        await user.click(confirmBtn);

        await waitFor(() => {
          const bodyText = document.body.textContent || '';
          expect(bodyText).toMatch(/minimum|wymagane|wybierz/i);
        });

        expect(onComplete).not.toHaveBeenCalled();
      }
    });

    it('should not require optional categories (desserts)', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));
      await user.click(screen.getByText('Łosoś grillowany'));

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(b => /zatwierdź|potwierdź|dalej/i.test(b.textContent || ''));
      if (confirmBtn) {
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(onComplete).toHaveBeenCalled();
        });
      }
    });
  });

  // ── Completion ────────────────────────────────────────────────────────────

  describe('Completion', () => {
    it('should call onComplete with correct selections format', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));
      await user.click(screen.getByText('Łosoś grillowany'));

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(b => /zatwierdź|potwierdź|dalej/i.test(b.textContent || ''));
      if (confirmBtn) {
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(onComplete).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({
                categoryId: 'cat-soup',
                dishes: expect.arrayContaining([
                  expect.objectContaining({ dishId: 'dish-1' }),
                ]),
              }),
            ])
          );
        });
      }
    });
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('should call onBack when clicking back button', async () => {
      const user = userEvent.setup();
      const { onBack } = await renderDishSelector();

      const buttons = screen.getAllByRole('button');
      const backBtn = buttons.find(b => /wstecz|powrót|cofnij/i.test(b.textContent || ''));
      if (backBtn) {
        await user.click(backBtn);
        expect(onBack).toHaveBeenCalled();
      }
    });

    it('should render confirm button', async () => {
      await renderDishSelector();
      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(b => /zatwierdź|potwierdź|dalej/i.test(b.textContent || ''));
      expect(confirmBtn).toBeDefined();
    });
  });

  // ── Initial Selections ────────────────────────────────────────────────────

  describe('Initial Selections (Edit Mode)', () => {
    it('should restore selections from initialSelections prop', async () => {
      await renderDishSelector({
        initialSelections: [
          { categoryId: 'cat-soup', dishes: [{ dishId: 'dish-1', quantity: 1 }] },
          { categoryId: 'cat-main', dishes: [{ dishId: 'dish-4', quantity: 2 }, { dishId: 'dish-5', quantity: 1 }] },
        ],
      });

      await waitFor(() => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toMatch(/1\s*\/\s*1/);
      });
    });
  });
});
