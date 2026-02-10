/**
 * Menu Course API Client
 * 
 * Type-safe API client for menu course endpoints
 */

import axios, { AxiosError } from 'axios';
import type {
  MenuCourse,
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
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface CreateMenuCourseInput {
  packageId: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
  icon?: string;
}

export interface UpdateMenuCourseInput {
  name?: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
  icon?: string;
}

export interface AssignDishInput {
  dishId: string;
  customPrice?: number;
  isDefault?: boolean;
  isRecommended?: boolean;
  displayOrder?: number;
}

export interface AssignDishesInput {
  dishes: AssignDishInput[];
}

// ════════════════════════════════════════════════════════════════════════════
// MENU COURSE API
// ════════════════════════════════════════════════════════════════════════════

export const menuCoursesApi = {
  /**
   * Get all courses for a package
   */
  getCoursesByPackage: async (packageId: string): Promise<ApiResponse<MenuCourse[]>> => {
    const { data } = await api.get<ApiResponse<MenuCourse[]>>(
      `/menu-courses/package/${packageId}`
    );
    return data;
  },

  /**
   * Get single course by ID
   */
  getCourse: async (id: string): Promise<ApiResponse<MenuCourse>> => {
    const { data } = await api.get<ApiResponse<MenuCourse>>(`/menu-courses/${id}`);
    return data;
  },

  /**
   * Create new menu course
   */
  createCourse: async (input: CreateMenuCourseInput): Promise<ApiResponse<MenuCourse>> => {
    const { data } = await api.post<ApiResponse<MenuCourse>>('/menu-courses', input);
    return data;
  },

  /**
   * Update menu course
   */
  updateCourse: async (id: string, input: UpdateMenuCourseInput): Promise<ApiResponse<MenuCourse>> => {
    const { data } = await api.put<ApiResponse<MenuCourse>>(`/menu-courses/${id}`, input);
    return data;
  },

  /**
   * Delete menu course
   */
  deleteCourse: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/menu-courses/${id}`);
    return data;
  },

  /**
   * Assign dishes to course
   */
  assignDishes: async (courseId: string, input: AssignDishesInput): Promise<ApiResponse<MenuCourse>> => {
    const { data } = await api.post<ApiResponse<MenuCourse>>(
      `/menu-courses/${courseId}/dishes`,
      input
    );
    return data;
  },

  /**
   * Remove dish from course
   */
  removeDish: async (courseId: string, dishId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(
      `/menu-courses/${courseId}/dishes/${dishId}`
    );
    return data;
  },
};

export { api as menuCoursesApiClient };
