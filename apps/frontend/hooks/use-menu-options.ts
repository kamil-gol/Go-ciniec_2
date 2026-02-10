import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMenuOptions,
  getMenuOptionById,
  createMenuOption,
  updateMenuOption,
  deleteMenuOption,
  type MenuOption,
  type CreateMenuOptionInput,
  type UpdateMenuOptionInput,
  type MenuOptionFilters,
} from '@/lib/api/menu-options-api';
import { toast } from 'sonner';

/**
 * Get all menu options with optional filtering
 */
export function useMenuOptions(filters?: MenuOptionFilters) {
  return useQuery({
    queryKey: ['menu-options', filters],
    queryFn: () => getMenuOptions(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get single menu option by ID
 */
export function useMenuOption(id: string | undefined) {
  return useQuery({
    queryKey: ['menu-option', id],
    queryFn: () => getMenuOptionById(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Create menu option mutation
 */
export function useCreateMenuOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuOptionInput) => createMenuOption(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-options'] });
      toast.success('Opcja menu została utworzona');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Nie udało się utworzyć opcji menu';
      toast.error(message);
    },
  });
}

/**
 * Update menu option mutation
 */
export function useUpdateMenuOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuOptionInput }) =>
      updateMenuOption(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-options'] });
      queryClient.invalidateQueries({ queryKey: ['menu-option', variables.id] });
      toast.success('Opcja menu została zaktualizowana');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Nie udało się zaktualizować opcji menu';
      toast.error(message);
    },
  });
}

/**
 * Delete menu option mutation
 */
export function useDeleteMenuOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMenuOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-options'] });
      toast.success('Opcja menu została usunięta');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Nie udało się usunąć opcji menu';
      toast.error(message);
    },
  });
}
