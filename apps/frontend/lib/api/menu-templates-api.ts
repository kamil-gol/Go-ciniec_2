/**
 * Menu Templates API Client
 * 
 * Type-safe API client for menu template endpoints
 */

import { apiClient } from '@/lib/api-client';

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description: string | null;
  variant: string | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  displayOrder: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  eventType?: {
    id: string;
    name: string;
    color: string | null;
  };
  packages?: MenuPackageBasic[];
  _count?: {
    packages: number;
  };
}

export interface MenuPackageBasic {
  id: string;
  name: string;
  pricePerAdult: string;
  pricePerChild: string;
  pricePerToddler: string;
}

export interface CreateMenuTemplateInput {
  eventTypeId: string;
  name: string;
  description?: string | null;
  variant?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface UpdateMenuTemplateInput {
  eventTypeId?: string;
  name?: string;
  description?: string | null;
  variant?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface DuplicateMenuTemplateInput {
  newName: string;
  newVariant?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface MenuTemplateFilters {
  eventTypeId?: string;
  isActive?: boolean;
  date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
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
 * Get all menu templates with optional filtering
 */
export async function getMenuTemplates(filters?: MenuTemplateFilters): Promise<MenuTemplate[]> {
  const query = filters ? buildQueryParams(filters) : '';
  const { data } = await apiClient.get<ApiResponse<MenuTemplate[]>>(`/menu-templates${query}`);
  return data.data;
}

/**
 * Get single menu template by ID
 */
export async function getMenuTemplateById(id: string): Promise<MenuTemplate> {
  const { data } = await apiClient.get<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`);
  return data.data;
}

/**
 * Get active menu template for event type
 */
export async function getActiveMenuTemplate(
  eventTypeId: string,
  date?: string
): Promise<MenuTemplate> {
  const query = date ? `?date=${date}` : '';
  const { data } = await apiClient.get<ApiResponse<MenuTemplate>>(
    `/menu-templates/active/${eventTypeId}${query}`
  );
  return data.data;
}

/**
 * Create new menu template
 */
export async function createMenuTemplate(input: CreateMenuTemplateInput): Promise<MenuTemplate> {
  const { data } = await apiClient.post<ApiResponse<MenuTemplate>>('/menu-templates', input);
  return data.data;
}

/**
 * Update menu template
 */
export async function updateMenuTemplate(
  id: string,
  input: UpdateMenuTemplateInput
): Promise<MenuTemplate> {
  const { data } = await apiClient.put<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`, input);
  return data.data;
}

/**
 * Delete menu template
 */
export async function deleteMenuTemplate(id: string): Promise<void> {
  await apiClient.delete(`/menu-templates/${id}`);
}

/**
 * Duplicate menu template with all packages
 */
export async function duplicateMenuTemplate(
  id: string,
  input: DuplicateMenuTemplateInput
): Promise<MenuTemplate> {
  const { data } = await apiClient.post<ApiResponse<MenuTemplate>>(
    `/menu-templates/${id}/duplicate`,
    input
  );
  return data.data;
}
