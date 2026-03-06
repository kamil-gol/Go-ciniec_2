/**
 * Dishes React Query Hooks
 * 
 * Custom hooks for dishes data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi, type DishFilters, type DishCategory } from '@/lib/api/dishes-api';
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
  categories: () => [...dishesKeys.all, 'categories'] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all dishes
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
 */
export function useDishesByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: dishesKeys.byCategoryId(categoryId!),
    queryFn: () => dishesApi.getDishesByCategory(categoryId!),
    select: (response) => response.data,
    enabled: !!categoryId,
  });
}

/**
 * Get all dish categories
 */
export function useDishCategories() {
  return useQuery({
    queryKey: dishesKeys.categories(),
    queryFn: () => dishesApi.getDishCategories(),
    select: (response) => response.data,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create dish
 */
export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDishInput) => dishesApi.createDish(input),
    onSuccess: () => {
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
 */
export function useDishesByCategories() {
  return useQuery({
    queryKey: [...dishesKeys.all, 'grouped'],
    queryFn: async () => {
      const response = await dishesApi.getDishes({ isActive: true });
      const dishes = response.data;

      const grouped = dishes.reduce((acc, dish) => {
        const categorySlug = (dish as any).category?.slug ?? 'other';
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
