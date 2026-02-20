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

// ─── Mocks ───────────────────────────────────────────────────────────────────

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
      categoryIcon: '🍰',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CourseList (DishSelector)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePackageCategories.mockReturnValue({ data: mockCategoryData, isLoading: false });
  });

  // ── Loading & Empty States ─────────────────────────────────────────────

  describe('Loading & Empty States', () => {
    it('should show spinner when loading', async () => {
      mockUsePackageCategories.mockReturnValue({ data: undefined, isLoading: true });
      const { container } = await renderDishSelector();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show info alert when no categories in package', async () => {
      mockUsePackageCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
      });
      await renderDishSelector();
      expect(screen.getByText(/nie wymaga wyboru dań/)).toBeInTheDocument();
    });

    it('should show info alert when categoryData is null', async () => {
      mockUsePackageCategories.mockReturnValue({ data: null, isLoading: false });
      await renderDishSelector();
      expect(screen.getByText(/nie wymaga wyboru dań/)).toBeInTheDocument();
    });
  });

  // ── Category Rendering ────────────────────────────────────────────────

  describe('Category Rendering', () => {
    it('should render all categories with names', async () => {
      await renderDishSelector();
      expect(screen.getByText('Zupy')).toBeInTheDocument();
      expect(screen.getByText('Danie na ciepło')).toBeInTheDocument(); // customLabel used
      expect(screen.getByText('Desery')).toBeInTheDocument();
    });

    it('should show category icons', async () => {
      await renderDishSelector();
      expect(screen.getByText('🍲')).toBeInTheDocument();
      expect(screen.getByText('🥩')).toBeInTheDocument();
      expect(screen.getByText('🍰')).toBeInTheDocument();
    });

    it('should show selection counter badge (0 / min-max)', async () => {
      await renderDishSelector();
      // Zupy: 0 / 1-2
      expect(screen.getByText('0 / 1-2')).toBeInTheDocument();
      // Dania główne: 0 / 2-3
      expect(screen.getByText('0 / 2-3')).toBeInTheDocument();
      // Desery: 0 / 0-2
      expect(screen.getByText('0 / 0-2')).toBeInTheDocument();
    });

    it('should use customLabel instead of categoryName when provided', async () => {
      await renderDishSelector();
      // cat-main has customLabel = 'Danie na ciepło' instead of 'Dania główne'
      expect(screen.getByText('Danie na ciepło')).toBeInTheDocument();
      expect(screen.queryByText('Dania główne')).not.toBeInTheDocument();
    });
  });

  // ── Dish Rendering ────────────────────────────────────────────────────

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
      // Rosół has gluten + jajka
      const allergenBadges = screen.getAllByText('gluten');
      expect(allergenBadges.length).toBeGreaterThan(0);
      expect(screen.getAllByText('jajka').length).toBeGreaterThan(0);
    });

    it('should not show allergens for dishes without them', async () => {
      await renderDishSelector();
      // Krem z pomidorów has no allergens — should still render without badge area
      expect(screen.getByText('Krem z pomidorów')).toBeInTheDocument();
    });
  });

  // ── Dish Selection ────────────────────────────────────────────────────

  describe('Dish Selection', () => {
    it('should select a dish on click', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        // Counter should update to 1 / 1-2
        expect(screen.getByText('1 / 1-2')).toBeInTheDocument();
      });
    });

    it('should deselect a dish on second click', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));
      await waitFor(() => expect(screen.getByText('1 / 1-2')).toBeInTheDocument());

      await user.click(screen.getByText('Rosół'));
      await waitFor(() => expect(screen.getByText('0 / 1-2')).toBeInTheDocument());
    });

    it('should show quantity selector when dish is selected', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        expect(screen.getByText('Ilość porcji:')).toBeInTheDocument();
      });
    });

    it('should prevent selecting more dishes than maxSelect', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      // Select 2 soups (max for soup category)
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Żurek'));

      // Try to select 3rd — should show toast
      await user.click(screen.getByText('Krem z pomidorów'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Limit osiągnięty',
            variant: 'destructive',
          })
        );
      });
    });

    it('should show max limit alert when at max selections', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      // Select 2 soups (max)
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Żurek'));

      await waitFor(() => {
        expect(screen.getByText(/Osiągnięto maksymalną liczbę pozycji/)).toBeInTheDocument();
      });
    });
  });

  // ── Quantity Selector ─────────────────────────────────────────────────

  describe('Quantity Selector', () => {
    it('should default to quantity 1 when dish selected', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        const select = screen.getByDisplayValue('1 porcja');
        expect(select).toBeInTheDocument();
      });
    });

    it('should allow changing quantity via select', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        expect(screen.getByText('Ilość porcji:')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('1 porcja');
      await user.selectOptions(select, '2');

      await waitFor(() => {
        // Counter should show total quantity 2
        expect(screen.getByText('2 / 1-2')).toBeInTheDocument();
      });
    });

    it('should prevent quantity exceeding maxSelect', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      // Select Rosół
      await user.click(screen.getByText('Rosół'));
      await waitFor(() => expect(screen.getByText('Ilość porcji:')).toBeInTheDocument());

      // Try to set quantity to 3 (max for soup is 2)
      const select = screen.getByDisplayValue('1 porcja');
      await user.selectOptions(select, '3');

      // Should show toast about limit
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Limit osiągnięty',
          })
        );
      });
    });

    it('should offer 0.5 increment options in quantity select', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        const select = screen.getByDisplayValue('1 porcja');
        const options = within(select as HTMLElement).getAllByRole('option');
        // Should have 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
        expect(options.length).toBe(10);
      });
    });
  });

  // ── Validation ────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should show error when required category has too few selections', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      // Don't select any soups (required, min 1)
      // Click confirm
      await user.click(screen.getByText('Zatwierdź wybór'));

      await waitFor(() => {
        expect(screen.getByText(/Wybierz minimum 1 pozycji/)).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should show error for main course category when min not met', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      // Select 1 soup (valid) but only 1 main (needs 2)
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));

      await user.click(screen.getByText('Zatwierdź wybór'));

      await waitFor(() => {
        expect(screen.getByText(/Wybierz minimum 2 pozycji/)).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should not require optional categories (deserts)', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      // Select required dishes
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));
      await user.click(screen.getByText('Łosoś grillowany'));

      await user.click(screen.getByText('Zatwierdź wybór'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('should clear error when user fixes the selection', async () => {
      const user = userEvent.setup();
      await renderDishSelector();

      // Trigger error
      await user.click(screen.getByText('Zatwierdź wybór'));
      await waitFor(() => {
        expect(screen.getByText(/Wybierz minimum 1 pozycji/)).toBeInTheDocument();
      });

      // Fix it by selecting a soup
      await user.click(screen.getByText('Rosół'));

      await waitFor(() => {
        expect(screen.queryByText(/Wybierz minimum 1 pozycji/)).not.toBeInTheDocument();
      });
    });
  });

  // ── Completion ────────────────────────────────────────────────────────

  describe('Completion', () => {
    it('should call onComplete with correct selections format', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      // Select required dishes
      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));
      await user.click(screen.getByText('Łosoś grillowany'));

      await user.click(screen.getByText('Zatwierdź wybór'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              categoryId: 'cat-soup',
              dishes: expect.arrayContaining([
                expect.objectContaining({ dishId: 'dish-1', quantity: 1 }),
              ]),
            }),
            expect.objectContaining({
              categoryId: 'cat-main',
              dishes: expect.arrayContaining([
                expect.objectContaining({ dishId: 'dish-4', quantity: 1 }),
                expect.objectContaining({ dishId: 'dish-5', quantity: 1 }),
              ]),
            }),
          ])
        );
      });
    });

    it('should not include empty categories in output', async () => {
      const user = userEvent.setup();
      const { onComplete } = await renderDishSelector();

      await user.click(screen.getByText('Rosół'));
      await user.click(screen.getByText('Polędwica wołowa'));
      await user.click(screen.getByText('Łosoś grillowany'));

      await user.click(screen.getByText('Zatwierdź wybór'));

      await waitFor(() => {
        const result = onComplete.mock.calls[0][0];
        // Should not include dessert category (nothing selected)
        const dessertCat = result.find((c: any) => c.categoryId === 'cat-dessert');
        expect(dessertCat).toBeUndefined();
      });
    });
  });

  // ── Navigation ────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('should render header and description', async () => {
      await renderDishSelector();
      expect(screen.getByText('Wybór Dań')).toBeInTheDocument();
      expect(screen.getByText(/Wybierz dania z każdej kategorii/)).toBeInTheDocument();
    });

    it('should call onBack when clicking Wstecz', async () => {
      const user = userEvent.setup();
      const { onBack } = await renderDishSelector();

      await user.click(screen.getByText('Wstecz'));
      expect(onBack).toHaveBeenCalled();
    });

    it('should render "Zatwierdź wybór" confirm button', async () => {
      await renderDishSelector();
      expect(screen.getByText('Zatwierdź wybór')).toBeInTheDocument();
    });
  });

  // ── Initial Selections ────────────────────────────────────────────────

  describe('Initial Selections (Edit Mode)', () => {
    it('should restore selections from initialSelections prop', async () => {
      await renderDishSelector({
        initialSelections: [
          { categoryId: 'cat-soup', dishes: [{ dishId: 'dish-1', quantity: 1 }] },
          { categoryId: 'cat-main', dishes: [{ dishId: 'dish-4', quantity: 2 }, { dishId: 'dish-5', quantity: 1 }] },
        ],
      });

      await waitFor(() => {
        // Soup counter: 1 / 1-2
        expect(screen.getByText('1 / 1-2')).toBeInTheDocument();
        // Main counter: 3 / 2-3 (2 + 1)
        expect(screen.getByText('3 / 2-3')).toBeInTheDocument();
      });
    });
  });
});
