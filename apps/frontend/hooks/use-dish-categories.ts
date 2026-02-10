/**
 * useDishCategories Hook
 * Manages dish categories data fetching and state
 */

import useSWR from 'swr';
import { DishCategory } from '@/types';
import { apiClient } from '@/lib/api-client';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/dish-categories`;

interface UseDishCategoriesReturn {
  categories: DishCategory[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string): Promise<DishCategory[]> => {
  const response = await apiClient.get<{ data: DishCategory[] }>(url);
  return response.data;
};

/**
 * Hook to fetch all dish categories
 */
export function useDishCategories(): UseDishCategoriesReturn {
  const { data, error, mutate, isLoading } = useSWR<DishCategory[]>(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    categories: data || [],
    isLoading,
    error: error || null,
    mutate,
  };
}

/**
 * Hook to fetch a single dish category by ID
 */
export function useDishCategory(id: string | null): {
  category: DishCategory | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, error, isLoading } = useSWR<DishCategory>(
    id ? `${API_URL}/${id}` : null,
    fetcher
  );

  return {
    category: data || null,
    isLoading,
    error: error || null,
  };
}
