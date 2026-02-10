/**
 * Dishes React Query Hooks
 * 
 * Custom hooks for dishes data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi, type DishFilters } from '@/lib/api/dishes-api';
import type { Dish, CreateDishInput, UpdateDishInput } from '@/types';
import { toast } from 'sonner';

// ════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ════════════════════════════════════════════════════════════════════════════

export const dishesKeys = {
  all: ['dishes'] as const,
  lists: () => [...dishesKeys.all, 'list'] as const,
  list: (filters?: DishFilters) => [...dishesKeys.lists(), filters] as const,
  details: () => [...dishesKeys.all, 'detail'] as const,
  detail: (id: string) => [...dishesKeys.details(), id] as const,
  byCategoryId: (categoryId: string) => [...dishesKeys.all, 'category', categoryId] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all dishes
 * 
 * @example
 * const { data: dishes, isLoading } = useDishes({ categoryId: 'abc-123' });
 */
export function useDishes(filters?: DishFilters) {
  return useQuery({
    queryKey: dishesKeys.list(filters),
    queryFn: () => dishesApi.getDishes(filters),
    select: (response) => response.data,
  });
}

/**
 * Get single dish
 * 
 * @example
 * const { data: dish } = useDish(dishId);
 */
export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: dishesKeys.detail(id!),
    queryFn: () => dishesApi.getDish(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get dishes by category ID
 * 
 * @example
 * const { data: soups } = useDishesByCategory(soupCategoryId);
 */
export function useDishesByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: dishesKeys.byCategoryId(categoryId!),
    queryFn: () => dishesApi.getDishesByCategory(categoryId!),
    select: (response) => response.data,
    enabled: !!categoryId,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create dish
 * 
 * @example
 * const mutation = useCreateDish();
 * mutation.mutate({ name: 'Rosół', categoryId: 'abc-123', ... });
 */
export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDishInput) => dishesApi.createDish(input),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
      toast.success('Danie zostało dodane');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się dodać dania');
    },
  });
}

/**
 * Update dish
 * 
 * @example
 * const mutation = useUpdateDish();
 * mutation.mutate({ id: '...', data: {...} });
 */
export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishInput }) => 
      dishesApi.updateDish(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dishesKeys.detail(variables.id) });
      toast.success('Danie zostało zaktualizowane');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się zaktualizować dania');
    },
  });
}

/**
 * Delete dish
 * 
 * @example
 * const mutation = useDeleteDish();
 * mutation.mutate(dishId);
 */
export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dishesApi.deleteDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
      toast.success('Danie zostało usunięte');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się usunąć dania');
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get dishes grouped by category slug
 * 
 * @example
 * const { data: groupedDishes } = useDishesByCategories();
 * // Returns: { 'SOUP': [...], 'MAIN_COURSE': [...] }
 */
export function useDishesByCategories() {
  return useQuery({
    queryKey: [...dishesKeys.all, 'grouped'],
    queryFn: async () => {
      const response = await dishesApi.getDishes({ isActive: true });
      const dishes = response.data;

      // Group by category slug
      const grouped = dishes.reduce((acc, dish) => {
        const categorySlug = dish.category.slug;
        if (!acc[categorySlug]) {
          acc[categorySlug] = [];
        }
        acc[categorySlug].push(dish);
        return acc;
      }, {} as Record<string, Dish[]>);

      return grouped;
    },
  });
}
