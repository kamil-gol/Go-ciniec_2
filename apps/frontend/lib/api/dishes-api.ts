/**
 * Dishes API Client
 * 
 * Type-safe API client for dishes endpoints
 */

import { apiClient } from '@/lib/api-client';
import type { Dish, CreateDishInput, UpdateDishInput } from '@/types';

export interface DishFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function buildQueryParams(params: Record<string, any>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, String(v)));
      } else {
        query.append(key, String(value));
      }
    }
  });
  
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export const dishesApi = {
  /**
   * Get all dishes
   */
  getDishes: async (filters?: DishFilters): Promise<ApiResponse<Dish[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await apiClient.get<ApiResponse<Dish[]>>(`/dishes${query}`);
    return data;
  },

  /**
   * Get single dish by ID
   */
  getDish: async (id: string): Promise<ApiResponse<Dish>> => {
    const { data } = await apiClient.get<ApiResponse<Dish>>(`/dishes/${id}`);
    return data;
  },

  /**
   * Create new dish
   */
  createDish: async (input: CreateDishInput): Promise<ApiResponse<Dish>> => {
    const { data } = await apiClient.post<ApiResponse<Dish>>('/dishes', input);
    return data;
  },

  /**
   * Update dish
   */
  updateDish: async (id: string, input: UpdateDishInput): Promise<ApiResponse<Dish>> => {
    const { data } = await apiClient.put<ApiResponse<Dish>>(`/dishes/${id}`, input);
    return data;
  },

  /**
   * Delete dish
   */
  deleteDish: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/dishes/${id}`);
    return data;
  },

  /**
   * Get dishes by category ID
   */
  getDishesByCategory: async (categoryId: string): Promise<ApiResponse<Dish[]>> => {
    const { data } = await apiClient.get<ApiResponse<Dish[]>>(`/dishes/category/${categoryId}`);
    return data;
  },
};

// Re-export types for convenience
export type { Dish, CreateDishInput, UpdateDishInput };
