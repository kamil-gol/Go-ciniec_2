/**
 * Menu Course Hooks
 * 
 * React Query hooks for menu course management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  menuCoursesApi,
  CreateMenuCourseInput,
  UpdateMenuCourseInput,
  AssignDishesInput,
} from '@/lib/api/menu-courses-api';
import { toast } from 'sonner'

// ════════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all courses for a package
 */
export function useCoursesByPackage(packageId: string) {
  return useQuery({
    queryKey: ['menu-courses', 'package', packageId],
    queryFn: async () => {
      const response = await menuCoursesApi.getCoursesByPackage(packageId);
      return response.data;
    },
    enabled: !!packageId,
  });
}

/**
 * Get single course by ID
 */
export function useCourse(id: string) {
  return useQuery({
    queryKey: ['menu-courses', id],
    queryFn: async () => {
      const response = await menuCoursesApi.getCourse(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMenuCourseInput) => menuCoursesApi.createCourse(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-courses', 'package', variables.packageId] });
      toast.success('Kurs został utworzony',);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Nie udało się utworzyć kursu');
    },
  });
}

/**
 * Update course
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuCourseInput }) =>
      menuCoursesApi.updateCourse(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-courses'] });
      queryClient.invalidateQueries({ queryKey: ['menu-courses', variables.id] });
      toast.success('Kurs został zaktualizowany',);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Nie udało się zaktualizować kursu');
    },
  });
}

/**
 * Delete course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuCoursesApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-courses'] });
      toast.success('Kurs został usunięty',);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Nie udało się usunąć kursu');
    },
  });
}

/**
 * Assign dishes to course
 */
export function useAssignDishes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: AssignDishesInput }) =>
      menuCoursesApi.assignDishes(courseId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-courses', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['menu-courses'] });
      toast.success('Dania zostały przypisane',);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Nie udało się przypisać dań');
    },
  });
}

/**
 * Remove dish from course
 */
export function useRemoveDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, dishId }: { courseId: string; dishId: string }) =>
      menuCoursesApi.removeDish(courseId, dishId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-courses', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['menu-courses'] });
      toast.success('Danie zostało usunięte z kursu',);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Nie udało się usunąć dania');
    },
  });
}
