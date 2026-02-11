/**
 * Menu Templates Hooks
 * 
 * React Query hooks for menu templates management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';

const QUERY_KEY = 'menu-templates';

/**
 * Get all menu templates
 */
export function useMenuTemplates(filters?: MenuTemplateFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => getMenuTemplates(filters),
  });
}

/**
 * Get single menu template by ID
 */
export function useMenuTemplate(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => getMenuTemplateById(id!),
    enabled: !!id,
  });
}

/**
 * Get active menu template for event type
 */
export function useActiveMenuTemplate(eventTypeId: string | undefined, date?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'active', eventTypeId, date],
    queryFn: () => getActiveMenuTemplate(eventTypeId!, date),
    enabled: !!eventTypeId,
  });
}

/**
 * Create menu template mutation
 */
export function useCreateMenuTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMenuTemplateInput) => createMenuTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Szablon menu utworzony');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas tworzenia szablonu');
    },
  });
}

/**
 * Update menu template mutation
 */
export function useUpdateMenuTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuTemplateInput }) =>
      updateMenuTemplate(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'detail', variables.id] });
      toast.success('Szablon menu zaktualizowany');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas aktualizacji szablonu');
    },
  });
}

/**
 * Delete menu template mutation
 */
export function useDeleteMenuTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMenuTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Szablon menu usunięty');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas usuwania szablonu');
    },
  });
}

/**
 * Duplicate menu template mutation
 */
export function useDuplicateMenuTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DuplicateMenuTemplateInput }) =>
      duplicateMenuTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Szablon menu zduplikowany');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas duplikacji szablonu');
    },
  });
}
