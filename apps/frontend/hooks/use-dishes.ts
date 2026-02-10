/**
 * Dish Hooks
 * 
 * React Query hooks for dish management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi, CreateDishInput, UpdateDishInput } from '@/lib/api/dishes-api';
import type { DishFilters } from '@/types/menu.types';
import { useToast } from './use-toast';

// ════════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all dishes with optional filters
 */
export function useDishes(filters?: DishFilters) {
  return useQuery({
    queryKey: ['dishes', filters],
    queryFn: async () => {
      const response = await dishesApi.getDishes(filters);
      return response.data;
    },
  });
}

/**
 * Get single dish by ID
 */
export function useDish(id: string) {
  return useQuery({
    queryKey: ['dishes', id],
    queryFn: async () => {
      const response = await dishesApi.getDish(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create new dish
 */
export function useCreateDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateDishInput) => dishesApi.createDish(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      toast({
        title: 'Sukces',
        description: 'Danie zostało utworzone',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.error || 'Nie udało się utworzyć dania',
      });
    },
  });
}

/**
 * Update dish
 */
export function useUpdateDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDishInput }) =>
      dishesApi.updateDish(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dishes', variables.id] });
      toast({
        title: 'Sukces',
        description: 'Danie zostało zaktualizowane',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.error || 'Nie udało się zaktualizować dania',
      });
    },
  });
}

/**
 * Delete dish
 */
export function useDeleteDish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => dishesApi.deleteDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      toast({
        title: 'Sukces',
        description: 'Danie zostało usunięte',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.error || 'Nie udało się usunąć dania',
      });
    },
  });
}
