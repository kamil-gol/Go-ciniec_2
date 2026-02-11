/**
 * Menu Options API Client
 * 
 * Type-safe API client for menu options endpoints
 */

import { apiClient } from '@/lib/api-client';

export interface MenuOption {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  category: string;
  priceType: string;
  priceAmount: string;
  allowMultiple: boolean;
  maxQuantity: number;
  icon: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuOptionInput {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  category: string;
  priceType: string;
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateMenuOptionInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string;
  priceType?: string;
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface MenuOptionFilters {
  category?: string;
  priceType?: string;
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
      query.append(key, String(value));
    }
  });
  
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get all menu options with optional filtering
 */
export async function getMenuOptions(filters?: MenuOptionFilters): Promise<MenuOption[]> {
  const query = filters ? buildQueryParams(filters) : '';
  const { data } = await apiClient.get<ApiResponse<MenuOption[]>>(`/menu-options${query}`);
  return data.data;
}

/**
 * Get single menu option by ID
 */
export async function getMenuOptionById(id: string): Promise<MenuOption> {
  const { data } = await apiClient.get<ApiResponse<MenuOption>>(`/menu-options/${id}`);
  return data.data;
}

/**
 * Create new menu option
 */
export async function createMenuOption(input: CreateMenuOptionInput): Promise<MenuOption> {
  const { data } = await apiClient.post<ApiResponse<MenuOption>>('/menu-options', input);
  return data.data;
}

/**
 * Update menu option
 */
export async function updateMenuOption(
  id: string,
  input: UpdateMenuOptionInput
): Promise<MenuOption> {
  const { data } = await apiClient.put<ApiResponse<MenuOption>>(`/menu-options/${id}`, input);
  return data.data;
}

/**
 * Delete menu option
 */
export async function deleteMenuOption(id: string): Promise<void> {
  await apiClient.delete(`/menu-options/${id}`);
}
