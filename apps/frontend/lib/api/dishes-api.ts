/**
 * Dish Library API Client
 * 
 * Type-safe API client for dish endpoints
 */

import axios, { AxiosError } from 'axios';
import type {
  Dish,
  DishFilters,
  ApiResponse,
  ApiError,
} from '@/types/menu.types';

// ════════════════════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ════════════════════════════════════════════════════════════════════════════

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject({
        success: false,
        error: 'Błąd połączenia z serwerem',
      });
    } else {
      return Promise.reject({
        success: false,
        error: error.message || 'Nieznany błąd',
      });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function buildQueryParams(params: Record<string, any>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

// ════════════════════════════════════════════════════════════════════════════
// DISH API
// ════════════════════════════════════════════════════════════════════════════

export interface CreateDishInput {
  name: string;
  description?: string;
  category: string;
  allergens?: string[];
  priceModifier?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateDishInput {
  name?: string;
  description?: string;
  category?: string;
  allergens?: string[];
  priceModifier?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export const dishesApi = {
  /**
   * Get all dishes with optional filters
   */
  getDishes: async (filters?: DishFilters): Promise<ApiResponse<Dish[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await api.get<ApiResponse<Dish[]>>(`/dishes${query}`);
    return data;
  },

  /**
   * Get single dish by ID
   */
  getDish: async (id: string): Promise<ApiResponse<Dish>> => {
    const { data } = await api.get<ApiResponse<Dish>>(`/dishes/${id}`);
    return data;
  },

  /**
   * Create new dish
   */
  createDish: async (input: CreateDishInput): Promise<ApiResponse<Dish>> => {
    const { data } = await api.post<ApiResponse<Dish>>('/dishes', input);
    return data;
  },

  /**
   * Update dish
   */
  updateDish: async (id: string, input: UpdateDishInput): Promise<ApiResponse<Dish>> => {
    const { data } = await api.put<ApiResponse<Dish>>(`/dishes/${id}`, input);
    return data;
  },

  /**
   * Delete dish
   */
  deleteDish: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/dishes/${id}`);
    return data;
  },
};

export { api as dishesApiClient };
