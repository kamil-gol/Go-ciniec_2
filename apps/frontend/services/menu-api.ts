/**
 * Menu API Service
 * 
 * Handles all API calls related to menu selection system
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description: string;
  variant: string;
  packages: MenuPackage[];
}

export interface MenuPackage {
  id: string;
  menuTemplateId?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: string;
  pricePerChild: string;
  pricePerToddler?: string;
  color?: string;
  icon?: string;
  badgeText?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
}

export interface MenuOption {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: 'CULINARY' | 'BEVERAGES' | 'DECORATIONS' | 'ENTERTAINMENT' | 'SERVICES';
  priceType: 'PER_PERSON' | 'PER_ADULT' | 'PER_CHILD' | 'FLAT_FEE' | 'FREE';
  priceAmount: string;
  allowMultiple: boolean;
  maxQuantity: number;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface ReservationMenu {
  id: string;
  reservationId: string;
  packageId: string;
  selectedOptions: string[];
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  };
  totalPrice: number;
  package: MenuPackage;
  options: MenuOption[];
}

export interface MenuCalculation {
  packageCost: number;
  optionsCost: number;
  totalCost: number;
  breakdown: {
    adults: number;
    children: number;
    toddlers: number;
  };
}

/**
 * Get all menu templates (optionally filtered by event type)
 */
export const getMenuTemplates = async (eventTypeId?: string): Promise<MenuTemplate[]> => {
  const params = eventTypeId ? { eventTypeId } : {};
  const response = await api.get('/menu-templates', { params });
  return response.data.data;
};

/**
 * Get menu template by ID
 */
export const getMenuTemplateById = async (id: string): Promise<MenuTemplate> => {
  const response = await api.get(`/menu-templates/${id}`);
  return response.data.data;
};

/**
 * Get all menu options
 */
export const getMenuOptions = async (): Promise<MenuOption[]> => {
  const response = await api.get('/menu-options');
  return response.data.data;
};

/**
 * Get menu for specific reservation
 */
export const getReservationMenu = async (reservationId: string): Promise<ReservationMenu> => {
  const response = await api.get(`/reservations/${reservationId}/menu`);
  return response.data.data;
};

/**
 * Select menu for reservation
 */
export const selectReservationMenu = async (
  reservationId: string,
  data: {
    packageId: string;
    selectedOptions?: string[];
    guestCounts: {
      adults: number;
      children: number;
      toddlers: number;
    };
  }
): Promise<ReservationMenu> => {
  const response = await api.post(`/reservations/${reservationId}/select-menu`, data);
  return response.data.data;
};

/**
 * Update reservation menu
 */
export const updateReservationMenu = async (
  reservationId: string,
  data: {
    packageId?: string;
    selectedOptions?: string[];
    guestCounts?: {
      adults: number;
      children: number;
      toddlers: number;
    };
  }
): Promise<ReservationMenu> => {
  const response = await api.put(`/reservations/${reservationId}/menu`, data);
  return response.data.data;
};

/**
 * Delete reservation menu
 */
export const deleteReservationMenu = async (reservationId: string): Promise<void> => {
  await api.delete(`/reservations/${reservationId}/menu`);
};

/**
 * Calculate menu price
 */
export const calculateMenuPrice = async (
  packageId: string,
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  },
  selectedOptions?: string[]
): Promise<MenuCalculation> => {
  const response = await api.post('/menu-calculator/calculate', {
    packageId,
    guestCounts,
    selectedOptions,
  });
  return response.data.data;
};

export default {
  getMenuTemplates,
  getMenuTemplateById,
  getMenuOptions,
  getReservationMenu,
  selectReservationMenu,
  updateReservationMenu,
  deleteReservationMenu,
  calculateMenuPrice,
};
