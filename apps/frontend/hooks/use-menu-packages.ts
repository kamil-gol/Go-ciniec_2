/**
 * Menu Packages Hooks
 * 
 * React Query hooks for menu packages management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllActivePackages,
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
import { toast } from 'sonner';

const QUERY_KEY = 'menu-packages';

/**
 * Get all active packages (for reservation form) 🆕 NEW!
 */
export function useAllActivePackages() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all-active'],
    queryFn: () => getAllActivePackages(),
  });
}

/**
 * Get all packages for a template
 */
export function usePackagesByTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'by-template', templateId],
    queryFn: () => getPackagesByTemplate(templateId!),
    enabled: !!templateId,
  });
}

/**
 * Get single package by ID
 */
export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => getPackageById(id!),
    enabled: !!id,
  });
}

/**
 * Create package mutation
 */
export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMenuPackageInput) => createPackage(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['menu-templates'] });
      toast.success('Pakiet utworzony');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas tworzenia pakietu');
    },
  });
}

/**
 * Update package mutation
 */
export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuPackageInput }) =>
      updatePackage(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['menu-templates'] });
      toast.success('Pakiet zaktualizowany');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas aktualizacji pakietu');
    },
  });
}

/**
 * Delete package mutation
 */
export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['menu-templates'] });
      toast.success('Pakiet usunięty');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas usuwania pakietu');
    },
  });
}

/**
 * Reorder packages mutation
 */
export function useReorderPackages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderPackagesInput) => reorderPackages(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kolejność zaktualizowana');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas zmiany kolejności');
    },
  });
}

/**
 * Assign options to package mutation
 */
export function useAssignOptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, input }: { packageId: string; input: AssignOptionsInput }) =>
      assignOptionsToPackage(packageId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'detail', variables.packageId] });
      toast.success('Opcje przypisane');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Błąd podczas przypisywania opcji');
    },
  });
}
