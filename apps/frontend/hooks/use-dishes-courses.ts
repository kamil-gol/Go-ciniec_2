/**
 * Dishes & Courses React Query Hooks
 * 
 * Custom hooks for dish library and menu courses management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi } from '@/lib/api/dishes-api';
import { menuCoursesApi } from '@/lib/api/menu-courses-api';
import type {
  Dish,
  MenuCourse,
  DishFilters,
  ApiResponse,
} from '@/types/menu.types';
import type {
  CreateDishInput,
  UpdateDishInput,
  CreateMenuCourseInput,
  UpdateMenuCourseInput,
  AssignDishesInput,
} from '@/lib/api/dishes-api';

// ════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ════════════════════════════════════════════════════════════════════════════

export const dishCoursesKeys = {
  all: ['dishes-courses'] as const,
  dishes: () => [...dishCoursesKeys.all, 'dishes'] as const,
  dish: (id: string) => [...dishCoursesKeys.dishes(), id] as const,
  courses: () => [...dishCoursesKeys.all, 'courses'] as const,
  coursesByPackage: (packageId: string) => [...dishCoursesKeys.courses(), 'package', packageId] as const,
  course: (id: string) => [...dishCoursesKeys.courses(), id] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// DISHES - QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all dishes
 * 
 * @example
 * const { data, isLoading } = useDishes({ category: 'SOUP' });
 */
export function useDishes(filters?: DishFilters) {
  return useQuery({
    queryKey: [...dishCoursesKeys.dishes(), filters],
    queryFn: () => dishesApi.getDishes(filters),
    select: (response) => response.data,
  });
}

/**
 * Get single dish
 * 
 * @example
 * const { data } = useDish(dishId);
 */
export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: dishCoursesKeys.dish(id!),
    queryFn: () => dishesApi.getDish(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// DISHES - MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create dish
 * 
 * @example
 * const mutation = useCreateDish();
 * mutation.mutate({ name: 'Rosoł', category: 'SOUP', ... });
 */
export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDishInput) => dishesApi.createDish(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() });
    },
  });
}

/**
 * Update dish
 * 
 * @example
 * const mutation = useUpdateDish();
 * mutation.mutate({ id: '...', data: {...} });
 */
export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishInput }) => 
      dishesApi.updateDish(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dish(variables.id) });
    },
  });
}

/**
 * Delete dish
 * 
 * @example
 * const mutation = useDeleteDish();
 * mutation.mutate(dishId);
 */
export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dishesApi.deleteDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MENU COURSES - QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get courses for a package
 * 
 * @example
 * const { data } = useMenuCourses(packageId);
 */
export function useMenuCourses(packageId: string | undefined | null) {
  return useQuery({
    queryKey: dishCoursesKeys.coursesByPackage(packageId!),
    queryFn: () => menuCoursesApi.getCoursesByPackage(packageId!),
    select: (response) => response.data,
    enabled: !!packageId,
  });
}

/**
 * Get single course
 * 
 * @example
 * const { data } = useMenuCourse(courseId);
 */
export function useMenuCourse(id: string | undefined) {
  return useQuery({
    queryKey: dishCoursesKeys.course(id!),
    queryFn: () => menuCoursesApi.getCourse(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MENU COURSES - MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create menu course
 * 
 * @example
 * const mutation = useCreateMenuCourse();
 * mutation.mutate({ packageId: '...', name: 'Zupa', ... });
 */
export function useCreateMenuCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMenuCourseInput) => menuCoursesApi.createCourse(input),
    onSuccess: (response) => {
      const packageId = response.data.packageId;
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(packageId) });
    },
  });
}

/**
 * Update menu course
 * 
 * @example
 * const mutation = useUpdateMenuCourse();
 * mutation.mutate({ id: '...', data: {...} });
 */
export function useUpdateMenuCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuCourseInput }) => 
      menuCoursesApi.updateCourse(id, data),
    onSuccess: (response, variables) => {
      const packageId = response.data.packageId;
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(packageId) });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.id) });
    },
  });
}

/**
 * Delete menu course
 * 
 * @example
 * const mutation = useDeleteMenuCourse();
 * mutation.mutate({ id: '...', packageId: '...' });
 */
export function useDeleteMenuCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, packageId }: { id: string; packageId: string }) => 
      menuCoursesApi.deleteCourse(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(variables.packageId) });
    },
  });
}

/**
 * Assign dishes to course
 * 
 * @example
 * const mutation = useAssignDishes();
 * mutation.mutate({ courseId: '...', dishes: [...] });
 */
export function useAssignDishes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: AssignDishesInput }) => 
      menuCoursesApi.assignDishes(courseId, input),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.courseId) });
      const packageId = response.data.packageId;
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(packageId) });
    },
  });
}

/**
 * Remove dish from course
 * 
 * @example
 * const mutation = useRemoveDish();
 * mutation.mutate({ courseId: '...', dishId: '...', packageId: '...' });
 */
export function useRemoveDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, dishId }: { courseId: string; dishId: string; packageId: string }) => 
      menuCoursesApi.removeDish(courseId, dishId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(variables.packageId) });
    },
  });
}
