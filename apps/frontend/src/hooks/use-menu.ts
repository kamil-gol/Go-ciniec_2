// apps/frontend/src/hooks/use-menu.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DishCategory, Dish } from '@/types/catering.types';

export function useDishCategories(): UseQueryResult<DishCategory[]> {
  return useQuery({
    queryKey: ['dish-categories'],
    queryFn: async () => {
      const res = await api.get('/dish-categories');
      return (res.data.data ?? []) as DishCategory[];
    },
    staleTime: 60_000,
  });
}

export function useDishesByCategory(
  categoryId: string | null,
): UseQueryResult<Dish[]> {
  return useQuery({
    queryKey: ['dishes', 'by-category', categoryId],
    queryFn: async () => {
      const res = await api.get(`/dishes/category/${categoryId}`);
      return (res.data.data ?? []) as Dish[];
    },
    enabled: !!categoryId,
    staleTime: 60_000,
  });
}
