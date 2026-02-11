import { apiClient } from './client';
import type {
  MenuPackage,
  CreatePackageInput,
  UpdatePackageInput,
  CategorySetting,
  CategorySettingInput,
  DishCategory,
  ApiResponse,
  PaginatedResponse,
} from '@/types/menu';

/**
 * Menu Packages API Service
 * 
 * Provides methods for CRUD operations on menu packages
 * and their category settings
 */

const BASE_URL = '/api/menu-packages';

/**
 * Get all packages
 * @param menuTemplateId - Optional filter by template
 */
export async function getPackages(
  menuTemplateId?: string
): Promise<MenuPackage[]> {
  try {
    const params = new URLSearchParams();
    if (menuTemplateId) {
      params.append('menuTemplateId', menuTemplateId);
    }

    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    const response = await apiClient.get<PaginatedResponse<MenuPackage>>(url);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch packages');
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    throw error;
  }
}

/**
 * Get package by ID
 */
export async function getPackage(id: string): Promise<MenuPackage> {
  try {
    const response = await apiClient.get<ApiResponse<MenuPackage>>(
      `${BASE_URL}/${id}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch package');
  } catch (error: any) {
    console.error('Error fetching package:', error);
    throw error;
  }
}

/**
 * Create new package
 */
export async function createPackage(
  data: CreatePackageInput
): Promise<MenuPackage> {
  try {
    const response = await apiClient.post<ApiResponse<MenuPackage>>(
      BASE_URL,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create package');
  } catch (error: any) {
    console.error('Error creating package:', error);
    throw error;
  }
}

/**
 * Update package
 */
export async function updatePackage(
  id: string,
  data: UpdatePackageInput
): Promise<MenuPackage> {
  try {
    const response = await apiClient.put<ApiResponse<MenuPackage>>(
      `${BASE_URL}/${id}`,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update package');
  } catch (error: any) {
    console.error('Error updating package:', error);
    throw error;
  }
}

/**
 * Delete package
 */
export async function deletePackage(id: string): Promise<void> {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${BASE_URL}/${id}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete package');
    }
  } catch (error: any) {
    console.error('Error deleting package:', error);
    throw error;
  }
}

/**
 * Get category settings for a package
 */
export async function getPackageCategories(
  packageId: string
): Promise<CategorySetting[]> {
  try {
    const response = await apiClient.get<
      ApiResponse<{ categories: CategorySetting[] }>
    >(`${BASE_URL}/${packageId}/categories`);

    if (response.success && response.data) {
      return response.data.categories || [];
    }

    throw new Error(response.message || 'Failed to fetch categories');
  } catch (error: any) {
    console.error('Error fetching package categories:', error);
    throw error;
  }
}

/**
 * Bulk update category settings for a package
 */
export async function updatePackageCategories(
  packageId: string,
  settings: CategorySettingInput[]
): Promise<CategorySetting[]> {
  try {
    const response = await apiClient.put<ApiResponse<CategorySetting[]>>(
      `${BASE_URL}/${packageId}/categories`,
      { settings }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update categories');
  } catch (error: any) {
    console.error('Error updating package categories:', error);
    throw error;
  }
}

/**
 * Get all dish categories
 */
export async function getDishCategories(): Promise<DishCategory[]> {
  try {
    const response = await apiClient.get<PaginatedResponse<DishCategory>>(
      '/api/dish-categories'
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch dish categories');
  } catch (error: any) {
    console.error('Error fetching dish categories:', error);
    throw error;
  }
}
