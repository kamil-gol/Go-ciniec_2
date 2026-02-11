/**
 * Menu Packages API Client
 * 
 * Type-safe API client for menu package endpoints
 */

import { apiClient } from '@/lib/api-client';

export interface MenuPackage {
  id: string;
  menuTemplateId: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  pricePerAdult: string;
  pricePerChild: string;
  pricePerToddler: string;
  color: string | null;
  icon: string | null;
  badgeText: string | null;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  includedItems: string[];
  minGuests: number | null;
  maxGuests: number | null;
  createdAt: string;
  updatedAt: string;
  menuTemplate?: {
    id: string;
    name: string;
    eventType?: {
      name: string;
    };
  };
  packageOptions?: PackageOption[];
  _count?: {
    packageOptions: number;
  };
}

export interface PackageOption {
  id: string;
  packageId: string;
  optionId: string;
  customPrice: string | null;
  isRequired: boolean;
  isDefault: boolean;
  isExclusive: boolean;
  displayOrder: number;
  option: {
    id: string;
    name: string;
    category: string;
    priceAmount: string;
    icon: string | null;
  };
}

export interface CreateMenuPackageInput {
  menuTemplateId: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  color?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number | null;
  maxGuests?: number | null;
}

export interface UpdateMenuPackageInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  color?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number | null;
  maxGuests?: number | null;
}

export interface AssignOptionsInput {
  optionIds: string[];
  isRequired?: boolean;
  isDefault?: boolean;
}

export interface ReorderPackagesInput {
  packageOrders: Array<{
    id: string;
    displayOrder: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

/**
 * Get all active packages (for reservation form) 🆕 NEW!
 */
export async function getAllActivePackages(): Promise<MenuPackage[]> {
  const { data } = await apiClient.get<ApiResponse<MenuPackage[]>>('/menu-packages');
  return data.data;
}

/**
 * Get all active packages for a specific event type
 * Used in reservation form to filter packages by selected event type
 */
export async function getPackagesByEventType(eventTypeId: string): Promise<MenuPackage[]> {
  const { data } = await apiClient.get<ApiResponse<MenuPackage[]>>(
    `/menu-packages/event-type/${eventTypeId}`
  );
  return data.data;
}

/**
 * Get all packages for a menu template
 */
export async function getPackagesByTemplate(templateId: string): Promise<MenuPackage[]> {
  const { data } = await apiClient.get<ApiResponse<MenuPackage[]>>(
    `/menu-packages/template/${templateId}`
  );
  return data.data;
}

/**
 * Get single package by ID
 */
export async function getPackageById(id: string): Promise<MenuPackage> {
  const { data } = await apiClient.get<ApiResponse<MenuPackage>>(`/menu-packages/${id}`);
  return data.data;
}

/**
 * Create new package
 */
export async function createPackage(input: CreateMenuPackageInput): Promise<MenuPackage> {
  const { data } = await apiClient.post<ApiResponse<MenuPackage>>('/menu-packages', input);
  return data.data;
}

/**
 * Update package
 */
export async function updatePackage(
  id: string,
  input: UpdateMenuPackageInput
): Promise<MenuPackage> {
  const { data } = await apiClient.put<ApiResponse<MenuPackage>>(`/menu-packages/${id}`, input);
  return data.data;
}

/**
 * Delete package
 */
export async function deletePackage(id: string): Promise<void> {
  await apiClient.delete(`/menu-packages/${id}`);
}

/**
 * Reorder packages
 */
export async function reorderPackages(input: ReorderPackagesInput): Promise<MenuPackage[]> {
  const { data } = await apiClient.put<ApiResponse<MenuPackage[]>>('/menu-packages/reorder', input);
  return data.data;
}

/**
 * Assign options to package
 */
export async function assignOptionsToPackage(
  packageId: string,
  input: AssignOptionsInput
): Promise<MenuPackage> {
  const { data } = await apiClient.post<ApiResponse<MenuPackage>>(
    `/menu-packages/${packageId}/options`,
    input
  );
  return data.data;
}
