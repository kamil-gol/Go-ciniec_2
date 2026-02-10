/**
 * Dish Categories React Query Hooks
 * 
 * Custom hooks for dish categories data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishCategoriesApi } from '@/lib/api/dish-categories-api';
import type { DishCategory, CreateDishCategoryInput, UpdateDishCategoryInput } from '@/types';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const dishCategoriesKeys = {
  all: ['dish-categories'] as const,
  lists: () => [...dishCategoriesKeys.all, 'list'] as const,
  list: (filters?: any) => [...dishCategoriesKeys.lists(), filters] as const,
  details: () => [...dishCategoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...dishCategoriesKeys.details(), id] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all dish categories
 * 
 * @example
 * const { data: categories, isLoading } = useDishCategories();
 */
export function useDishCategories() {
  return useQuery({
    queryKey: dishCategoriesKeys.list(),
    queryFn: () => dishCategoriesApi.getCategories(),
    select: (response) => response.data,
  });
}

/**
 * Get single dish category
 * 
 * @example
 * const { data: category } = useDishCategory(categoryId);
 */
export function useDishCategory(id: string | undefined) {
  return useQuery({
    queryKey: dishCategoriesKeys.detail(id!),
    queryFn: () => dishCategoriesApi.getCategory(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create dish category
 * 
 * @example
 * const mutation = useCreateDishCategory();
 * mutation.mutate({ slug: 'SOUP', name: 'Zupy', icon: '🍜' });
 */
export function useCreateDishCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDishCategoryInput) => dishCategoriesApi.createCategory(input),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() });
      toast.success('Kategoria została dodana');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się dodać kategorii');
    },
  });
}

/**
 * Update dish category
 * 
 * @example
 * const mutation = useUpdateDishCategory();
 * mutation.mutate({ id: '...', data: {...} });
 */
export function useUpdateDishCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishCategoryInput }) => 
      dishCategoriesApi.updateCategory(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.detail(variables.id) });
      toast.success('Kategoria została zaktualizowana');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się zaktualizować kategorii');
    },
  });
}

/**
 * Delete dish category
 * 
 * @example
 * const mutation = useDeleteDishCategory();
 * mutation.mutate(categoryId);
 */
export function useDeleteDishCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dishCategoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() });
      toast.success('Kategoria została usunięta');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Nie udało się usunąć kategorii');
    },
  });
}
