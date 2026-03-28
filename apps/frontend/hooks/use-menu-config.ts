/**
 * Menu Configuration Hooks
 *
 * Consolidated React Query hooks for menu admin/configuration:
 * - Templates (CRUD + duplicate)
 * - Packages (CRUD + reorder + assign options)
 * - Dish Categories (CRUD)
 * - Dishes & Courses (CRUD + assign/remove)
 *
 * NOTE: Reservation-level menu hooks remain in use-menu.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ═══ Template API ═══
import {
  getMenuTemplates,
  getMenuTemplateById,
  getActiveMenuTemplate,
  createMenuTemplate,
  updateMenuTemplate,
  deleteMenuTemplate,
  duplicateMenuTemplate,
  type MenuTemplate,
  type CreateMenuTemplateInput,
  type UpdateMenuTemplateInput,
  type DuplicateMenuTemplateInput,
  type MenuTemplateFilters,
} from '@/lib/api/menu-templates-api';

// ═══ Package API ═══
import {
  getAllActivePackages,
  getPackagesByEventType,
  getPackagesByTemplate,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  reorderPackages,
  assignOptionsToPackage,
  type CreateMenuPackageInput,
  type UpdateMenuPackageInput,
  type ReorderPackagesInput,
  type AssignOptionsInput,
} from '@/lib/api/menu-packages-api';

// ═══ Dish Category API ═══
import { dishCategoriesApi } from '@/lib/api/dish-categories-api';
import type { DishCategory, CreateDishCategoryInput, UpdateDishCategoryInput, MutationError } from '@/types';

// ═══ Dishes & Courses API ═══
import { dishesApi } from '@/lib/api/dishes-api';
import { menuCoursesApi } from '@/lib/api/menu-courses-api';
import type { Dish, MenuCourse, DishFilters, ApiResponse } from '@/types/menu.types';
import type { CreateDishInput, UpdateDishInput } from '@/lib/api/dishes-api';
import type { CreateMenuCourseInput, UpdateMenuCourseInput, AssignDishesInput } from '@/lib/api/menu-courses-api';

// ════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ════════════════════════════════════════════════════════════════════════════

const TEMPLATES_KEY = 'menu-templates';
const PACKAGES_KEY = 'menu-packages';

export const dishCategoriesKeys = {
  all: ['dish-categories'] as const,
  lists: () => [...dishCategoriesKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...dishCategoriesKeys.lists(), filters] as const,
  details: () => [...dishCategoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...dishCategoriesKeys.details(), id] as const,
};

export const dishCoursesKeys = {
  all: ['dishes-courses'] as const,
  dishes: () => [...dishCoursesKeys.all, 'dishes'] as const,
  dish: (id: string) => [...dishCoursesKeys.dishes(), id] as const,
  courses: () => [...dishCoursesKeys.all, 'courses'] as const,
  coursesByPackage: (packageId: string) => [...dishCoursesKeys.courses(), 'package', packageId] as const,
  course: (id: string) => [...dishCoursesKeys.courses(), id] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

export function useMenuTemplates(filters?: MenuTemplateFilters) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, 'list', filters],
    queryFn: () => getMenuTemplates(filters),
  });
}

export function useMenuTemplate(id: string | undefined) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, 'detail', id],
    queryFn: () => getMenuTemplateById(id!),
    enabled: !!id,
  });
}

export function useActiveMenuTemplate(eventTypeId: string | undefined, date?: string) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, 'active', eventTypeId, date],
    queryFn: () => getActiveMenuTemplate(eventTypeId!, date),
    enabled: !!eventTypeId,
  });
}

export function useCreateMenuTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMenuTemplateInput) => createMenuTemplate(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); toast.success('Szablon menu utworzony'); },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas tworzenia szablonu'); },
  });
}

export function useUpdateMenuTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuTemplateInput }) => updateMenuTemplate(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY, 'detail', variables.id] });
      toast.success('Szablon menu zaktualizowany');
    },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas aktualizacji szablonu'); },
  });
}

export function useDeleteMenuTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenuTemplate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); toast.success('Szablon menu usunięty'); },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas usuwania szablonu'); },
  });
}

export function useDuplicateMenuTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DuplicateMenuTemplateInput }) => duplicateMenuTemplate(id, input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); toast.success('Szablon menu zduplikowany'); },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas duplikacji szablonu'); },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// PACKAGES
// ════════════════════════════════════════════════════════════════════════════

export function useAllActivePackages() {
  return useQuery({
    queryKey: [PACKAGES_KEY, 'all-active'],
    queryFn: () => getAllActivePackages(),
  });
}

export function usePackagesByEventType(eventTypeId: string | undefined) {
  return useQuery({
    queryKey: [PACKAGES_KEY, 'by-event-type', eventTypeId],
    queryFn: () => getPackagesByEventType(eventTypeId!),
    enabled: !!eventTypeId,
  });
}

export function usePackagesByTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: [PACKAGES_KEY, 'by-template', templateId],
    queryFn: () => getPackagesByTemplate(templateId!),
    enabled: !!templateId,
  });
}

export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: [PACKAGES_KEY, 'detail', id],
    queryFn: () => getPackageById(id!),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMenuPackageInput) => createPackage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      toast.success('Pakiet utworzony');
    },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas tworzenia pakietu'); },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuPackageInput }) => updatePackage(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      toast.success('Pakiet zaktualizowany');
    },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas aktualizacji pakietu'); },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      toast.success('Pakiet usunięty');
    },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas usuwania pakietu'); },
  });
}

export function useReorderPackages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderPackagesInput) => reorderPackages(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY] }); toast.success('Kolejność zaktualizowana'); },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas zmiany kolejności'); },
  });
}

export function useAssignOptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, input }: { packageId: string; input: AssignOptionsInput }) => assignOptionsToPackage(packageId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY, 'detail', variables.packageId] });
      toast.success('Opcje przypisane');
    },
    onError: (error: MutationError) => { toast.error(error.response?.data?.error || 'Błąd podczas przypisywania opcji'); },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// DISH CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export function useDishCategories() {
  return useQuery({
    queryKey: dishCategoriesKeys.list(),
    queryFn: () => dishCategoriesApi.getCategories(),
    select: (response) => response.data,
  });
}

export function useDishCategory(id: string | undefined) {
  return useQuery({
    queryKey: dishCategoriesKeys.detail(id!),
    queryFn: () => dishCategoriesApi.getCategory(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useCreateDishCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDishCategoryInput) => dishCategoriesApi.createCategory(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() }); toast.success('Kategoria została dodana'); },
    onError: (error: MutationError) => { toast.error(error?.error || 'Nie udało się dodać kategorii'); },
  });
}

export function useUpdateDishCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishCategoryInput }) => dishCategoriesApi.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.detail(variables.id) });
      toast.success('Kategoria została zaktualizowana');
    },
    onError: (error: MutationError) => { toast.error(error?.error || 'Nie udało się zaktualizować kategorii'); },
  });
}

export function useDeleteDishCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dishCategoriesApi.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: dishCategoriesKeys.lists() }); toast.success('Kategoria została usunięta'); },
    onError: (error: MutationError) => { toast.error(error?.error || 'Nie udało się usunąć kategorii'); },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// DISHES
// ════════════════════════════════════════════════════════════════════════════

export function useDishes(filters?: DishFilters) {
  return useQuery({
    queryKey: [...dishCoursesKeys.dishes(), filters],
    queryFn: () => dishesApi.getDishes(filters),
    select: (response) => response.data,
  });
}

export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: dishCoursesKeys.dish(id!),
    queryFn: () => dishesApi.getDish(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDishInput) => dishesApi.createDish(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() }); },
  });
}

export function useUpdateDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishInput }) => dishesApi.updateDish(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dish(variables.id) });
    },
  });
}

export function useDeleteDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dishesApi.deleteDish(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: dishCoursesKeys.dishes() }); },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MENU COURSES
// ════════════════════════════════════════════════════════════════════════════

export function useMenuCourses(packageId: string | undefined | null) {
  return useQuery({
    queryKey: dishCoursesKeys.coursesByPackage(packageId!),
    queryFn: () => menuCoursesApi.getCoursesByPackage(packageId!),
    select: (response) => response.data,
    enabled: !!packageId,
  });
}

export function useMenuCourse(id: string | undefined) {
  return useQuery({
    queryKey: dishCoursesKeys.course(id!),
    queryFn: () => menuCoursesApi.getCourse(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

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

export function useUpdateMenuCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuCourseInput }) => menuCoursesApi.updateCourse(id, data),
    onSuccess: (response, variables) => {
      const packageId = response.data.packageId;
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(packageId) });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.id) });
    },
  });
}

export function useDeleteMenuCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, packageId }: { id: string; packageId: string }) => menuCoursesApi.deleteCourse(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(variables.packageId) });
    },
  });
}

export function useAssignDishes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: AssignDishesInput }) => menuCoursesApi.assignDishes(courseId, input),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.courseId) });
      const packageId = response.data.packageId;
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(packageId) });
    },
  });
}

export function useRemoveDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, dishId }: { courseId: string; dishId: string; packageId: string }) => menuCoursesApi.removeDish(courseId, dishId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.course(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: dishCoursesKeys.coursesByPackage(variables.packageId) });
    },
  });
}
