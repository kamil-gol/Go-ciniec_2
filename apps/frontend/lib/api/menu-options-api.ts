import apiClient from './api-client';

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

/**
 * Get all menu options with optional filtering
 */
export async function getMenuOptions(filters?: MenuOptionFilters): Promise<MenuOption[]> {
  const params = new URLSearchParams();
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.priceType) params.append('priceType', filters.priceType);
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters?.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const url = queryString ? `/menu-options?${queryString}` : '/menu-options';
  
  const response = await apiClient.get(url);
  return response.data.data;
}

/**
 * Get single menu option by ID
 */
export async function getMenuOptionById(id: string): Promise<MenuOption> {
  const response = await apiClient.get(`/menu-options/${id}`);
  return response.data.data;
}

/**
 * Create new menu option
 */
export async function createMenuOption(data: CreateMenuOptionInput): Promise<MenuOption> {
  const response = await apiClient.post('/menu-options', data);
  return response.data.data;
}

/**
 * Update menu option
 */
export async function updateMenuOption(
  id: string,
  data: UpdateMenuOptionInput
): Promise<MenuOption> {
  const response = await apiClient.put(`/menu-options/${id}`, data);
  return response.data.data;
}

/**
 * Delete menu option
 */
export async function deleteMenuOption(id: string): Promise<void> {
  await apiClient.delete(`/menu-options/${id}`);
}
