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

export function useDishes(): UseQueryResult<Dish[]> {
  return useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      const res = await api.get('/dishes');
      return (res.data.data ?? []) as Dish[];
    },
    staleTime: 60_000,
  });
}
