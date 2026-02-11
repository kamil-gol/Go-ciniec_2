/**
 * Menu System API Client
 * 
 * Type-safe API client for menu endpoints
 */

import axios, { AxiosError } from 'axios';
import type {
  MenuTemplate,
  MenuPackage,
  MenuOption,
  MenuTemplateFilters,
  MenuOptionFilters,
  MenuSelectionInput,
  ReservationMenuResponse,
  ApiResponse,
  ApiError,
} from '@/types/menu.types';

// ════════════════════════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ════════════════════════════════════════════════════════════════════════════════

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // API error response
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Network error
      return Promise.reject({
        success: false,
        error: 'Błąd połączenia z serwerem',
      });
    } else {
      // Other error
      return Promise.reject({
        success: false,
        error: error.message || 'Nieznany błąd',
      });
    }
  }
);

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

  /**
   * Get all menu templates
   */
  getTemplates: async (filters?: MenuTemplateFilters): Promise<ApiResponse<MenuTemplate[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await api.get<ApiResponse<MenuTemplate[]>>(`/menu-templates${query}`);
    return data;
  },

  /**
   * Get single menu template by ID
   */
  getTemplate: async (id: string): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await api.get<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`);
    return data;
  },

  /**
   * Get active menu template for event type
   */
  getActiveTemplate: async (eventTypeId: string): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await api.get<ApiResponse<MenuTemplate>>(
      `/menu-templates/active/${eventTypeId}`
    );
    return data;
  },

  /**
   * Create new menu template
   */
  createTemplate: async (input: any): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await api.post<ApiResponse<MenuTemplate>>('/menu-templates', input);
    return data;
  },

  /**
   * Update menu template
   */
  updateTemplate: async (id: string, input: any): Promise<ApiResponse<MenuTemplate>> => {
    const { data } = await api.put<ApiResponse<MenuTemplate>>(`/menu-templates/${id}`, input);
    return data;
  },

  /**
   * Delete menu template
   */
  deleteTemplate: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/menu-templates/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // MENU PACKAGES
  // ────────────────────────────────────────

  /**
   * Get all packages for a menu template
   */
  getPackages: async (templateId: string): Promise<ApiResponse<MenuPackage[]>> => {
    const { data } = await api.get<ApiResponse<MenuPackage[]>>(
      `/menu-packages/template/${templateId}`
    );
    return data;
  },

  /**
   * Get single package by ID
   */
  getPackage: async (id: string): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await api.get<ApiResponse<MenuPackage>>(`/menu-packages/${id}`);
    return data;
  },

  /**
   * Create new menu package
   */
  createPackage: async (input: any): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await api.post<ApiResponse<MenuPackage>>('/menu-packages', input);
    return data;
  },

  /**
   * Update menu package
   */
  updatePackage: async (id: string, input: any): Promise<ApiResponse<MenuPackage>> => {
    const { data } = await api.put<ApiResponse<MenuPackage>>(`/menu-packages/${id}`, input);
    return data;
  },

  /**
   * Delete menu package
   */
  deletePackage: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/menu-packages/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // MENU OPTIONS
  // ────────────────────────────────────────

  /**
   * Get all menu options
   */
  getOptions: async (filters?: MenuOptionFilters): Promise<ApiResponse<MenuOption[]>> => {
    const query = filters ? buildQueryParams(filters) : '';
    const { data } = await api.get<ApiResponse<MenuOption[]>>(`/menu-options${query}`);
    return data;
  },

  /**
   * Get single option by ID
   */
  getOption: async (id: string): Promise<ApiResponse<MenuOption>> => {
    const { data } = await api.get<ApiResponse<MenuOption>>(`/menu-options/${id}`);
    return data;
  },

  /**
   * Create new menu option
   */
  createOption: async (input: any): Promise<ApiResponse<MenuOption>> => {
    const { data } = await api.post<ApiResponse<MenuOption>>('/menu-options', input);
    return data;
  },

  /**
   * Update menu option
   */
  updateOption: async (id: string, input: any): Promise<ApiResponse<MenuOption>> => {
    const { data } = await api.put<ApiResponse<MenuOption>>(`/menu-options/${id}`, input);
    return data;
  },

  /**
   * Delete menu option
   */
  deleteOption: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/menu-options/${id}`);
    return data;
  },

  // ────────────────────────────────────────
  // RESERVATION MENU SELECTION
  // ────────────────────────────────────────

  /**
   * Select menu for reservation (initial selection)
   * Uses POST /reservations/:id/menu
   */
  selectMenu: async (
    reservationId: string,
    selection: MenuSelectionInput
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await api.post<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      selection
    );
    return data;
  },

  /**
   * Update menu selection for reservation
   * Uses PUT /reservations/:id/menu
   */
  updateMenu: async (
    reservationId: string,
    selection: MenuSelectionInput
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await api.put<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      selection
    );
    return data;
  },

  /**
   * Get menu snapshot for reservation
   */
  getReservationMenu: async (
    reservationId: string
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await api.get<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`
    );
    return data;
  },

  /**
   * Update guest counts for reservation menu
   */
  updateGuestCounts: async (
    reservationId: string,
    counts: {
      adultsCount: number;
      childrenCount: number;
      toddlersCount: number;
    }
  ): Promise<ApiResponse<ReservationMenuResponse>> => {
    const { data } = await api.put<ApiResponse<ReservationMenuResponse>>(
      `/reservations/${reservationId}/menu`,
      counts
    );
    return data;
  },

  /**
   * Remove menu selection from reservation
   */
  removeMenu: async (reservationId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(
      `/reservations/${reservationId}/menu`
    );
    return data;
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT AXIOS INSTANCE FOR CUSTOM REQUESTS
// ════════════════════════════════════════════════════════════════════════════════

export { api as apiClient };
