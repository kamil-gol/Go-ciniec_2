/**
 * Dish Categories API Client
 * 
 * Type-safe API client for dish categories endpoints
 */

import { apiClient } from '@/lib/api-client';
import type { DishCategory, CreateDishCategoryInput, UpdateDishCategoryInput } from '@/types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const dishCategoriesApi = {
  /**
   * Get all dish categories
   */
  getCategories: async (): Promise<ApiResponse<DishCategory[]>> => {
    const { data } = await apiClient.get<ApiResponse<DishCategory[]>>('/dish-categories');
    return data;
  },

  /**
   * Get single category by ID
   */
  getCategory: async (id: string): Promise<ApiResponse<DishCategory>> => {
    const { data } = await apiClient.get<ApiResponse<DishCategory>>(`/dish-categories/${id}`);
    return data;
  },

  /**
   * Create new category
   */
  createCategory: async (input: CreateDishCategoryInput): Promise<ApiResponse<DishCategory>> => {
    const { data } = await apiClient.post<ApiResponse<DishCategory>>('/dish-categories', input);
    return data;
  },

  /**
   * Update category
   */
  updateCategory: async (id: string, input: UpdateDishCategoryInput): Promise<ApiResponse<DishCategory>> => {
    const { data } = await apiClient.put<ApiResponse<DishCategory>>(`/dish-categories/${id}`, input);
    return data;
  },

  /**
   * Delete category
   */
  deleteCategory: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/dish-categories/${id}`);
    return data;
  },
};
