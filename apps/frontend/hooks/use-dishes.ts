/**
 * Dishes React Query Hooks
 * 
 * Custom hooks for dishes data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi, type Dish, type DishFilters, type CreateDishInput, type UpdateDishInput } from '@/lib/api/dishes-api';
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
  byCategory: (category: string) => [...dishesKeys.all, 'category', category] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all dishes
 * 
 * @example
 * const { data: dishes, isLoading } = useDishes({ category: 'SOUP' });
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
 * Get dishes by category
 * 
 * @example
 * const { data: soups } = useDishesByCategory('SOUP');
 */
export function useDishesByCategory(category: string | undefined) {
  return useQuery({
    queryKey: dishesKeys.byCategory(category!),
    queryFn: () => dishesApi.getDishesByCategory(category!),
    select: (response) => response.data,
    enabled: !!category,
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
 * mutation.mutate({ name: 'Rosół', category: 'SOUP', ... });
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
 * Get dishes grouped by category
 * 
 * @example
 * const { data: groupedDishes } = useDishesByCategories();
 */
export function useDishesByCategories() {
  return useQuery({
    queryKey: [...dishesKeys.all, 'grouped'],
    queryFn: async () => {
      const response = await dishesApi.getDishes({ isActive: true });
      const dishes = response.data;

      // Group by category
      const grouped = dishes.reduce((acc, dish) => {
        const category = dish.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(dish);
        return acc;
      }, {} as Record<string, Dish[]>);

      return grouped;
    },
  });
}

/**
 * Get dish categories with counts
 * 
 * @example
 * const { data: categories } = useDishCategories();
 */
export function useDishCategories() {
  return useQuery({
    queryKey: [...dishesKeys.all, 'categories'],
    queryFn: async () => {
      const response = await dishesApi.getDishes();
      const dishes = response.data;

      // Count dishes per category
      const categories = dishes.reduce((acc, dish) => {
        const category = dish.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(categories).map(([name, count]) => ({
        name,
        count,
      }));
    },
  });
}
