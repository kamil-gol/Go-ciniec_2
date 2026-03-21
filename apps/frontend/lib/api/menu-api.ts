/**
 * Menu System API Client
 * 
 * Type-safe API client for menu endpoints
 * Uses the shared apiClient from lib/api-client.ts
 */

import { apiClient } from '../api-client';
import type {
  MenuTemplate,
  MenuPackage,
  MenuOption,
  MenuTemplateFilters,
  MenuOptionFilters,
  MenuSelectionInput,
  ReservationMenuResponse,
  ApiResponse,
} from '@/types/menu.types';

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════════
// MENU API
// ════════════════════════════════════════════════════════════════════════════════

export const menuApi = {
  // ────────────────────────────────────────
  // MENU TEMPLATES
  // ────────────────────────────────────────

  getTemplates: async (filters?: MenuTemplateFilters): Promise<ApiResponse<MenuTemplate[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await apiClient.get<ApiResponse<MenuTemplate[]>>(`/menu-templates${query}`);
    return data;
  },

  getTemplate: async (id: string): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await apiClient.get<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`);
    return data;
  },

  getActiveTemplate: async (eventTypeId: string): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await apiClient.get<ApiResponse<MenuTemplate>>(
      `/menu-templates/active/${eventTypeId}`
    );
    return data;
  },

  createTemplate: async (input: any): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await apiClient.post<ApiResponse<MenuTemplate>>('/menu-templates', input);
    return data;
  },

  updateTemplate: async (id: string, input: any): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await apiClient.put<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`, input);
    return data;
  },

  deleteTemplate: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/menu-templates/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // MENU PACKAGES
  // ────────────────────────────────────────

  getPackages: async (templateId: string): Promise<ApiResponse<MenuPackage[]>> => {
    const { data } = await apiClient.get<ApiResponse<MenuPackage[]>>(
      `/menu-packages/template/${templateId}`
    );
    return data;
  },

  getPackage: async (id: string): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await apiClient.get<ApiResponse<MenuPackage>>(`/menu-packages/${id}`);
    return data;
  },

  getPackageCategories: async (packageId: string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/menu-packages/${packageId}/categories`
    );
    return data;
  },

  createPackage: async (input: any): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await apiClient.post<ApiResponse<MenuPackage>>('/menu-packages', input);
    return data;
  },

  updatePackage: async (id: string, input: any): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await apiClient.put<ApiResponse<MenuPackage>>(`/menu-packages/${id}`, input);
    return data;
  },

  deletePackage: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/menu-packages/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // MENU OPTIONS
  // ────────────────────────────────────────

  getOptions: async (filters?: MenuOptionFilters): Promise<ApiResponse<MenuOption[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await apiClient.get<ApiResponse<MenuOption[]>>(`/menu-options${query}`);
    return data;
  },

  getOption: async (id: string): Promise<ApiResponse<MenuOption>> => {
    const { data } = await apiClient.get<ApiResponse<MenuOption>>(`/menu-options/${id}`);
    return data;
  },

  createOption: async (input: any): Promise<ApiResponse<MenuOption>> => {
    const { data } = await apiClient.post<ApiResponse<MenuOption>>('/menu-options', input);
    return data;
  },

  updateOption: async (id: string, input: any): Promise<ApiResponse<MenuOption>> => {
    const { data } = await apiClient.put<ApiResponse<MenuOption>>(`/menu-options/${id}`, input);
    return data;
  },

  deleteOption: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/menu-options/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // RESERVATION MENU SELECTION
  // ────────────────────────────────────────

  selectMenu: async (
    reservationId: string,
    selection: MenuSelectionInput
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await apiClient.post<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      selection
    );
    return data;
  },

  updateMenu: async (
    reservationId: string,
    selection: MenuSelectionInput
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await apiClient.put<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      selection
    );
    return data;
  },

  /**
   * Get menu snapshot for reservation.
   * Uses _silent flag to suppress 404 toast — no menu is a valid state,
   * not an error. The hook handles null gracefully.
   */
  getReservationMenu: async (
    reservationId: string
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await apiClient.get<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      { _silent: true } as any
    );
    return data;
  },

  updateGuestCounts: async (
    reservationId: string,
    counts: {
      adultsCount: number;
      childrenCount: number;
      toddlersCount: number;
    }
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await apiClient.put<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      counts
    );
    return data;
  },

  removeMenu: async (reservationId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reservations/${reservationId}/menu`
    );
    return data;
  },
};
