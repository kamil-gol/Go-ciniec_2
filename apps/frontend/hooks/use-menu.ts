/**
 * Menu System React Query Hooks
 * 
 * Custom hooks for data fetching and mutations
 * UPDATED: Phase C — all mutation hooks invalidate both menu AND reservation queries
 * UPDATED: Polonized all user-facing strings
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { menuApi } from '@/lib/api/menu-api';
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

// ══════════════════════════════════════════════════════════════════
// QUERY KEYS
// ══════════════════════════════════════════════════════════════════

export const menuKeys = {
  all: ['menu'] as const,
  templates: () => [...menuKeys.all, 'templates'] as const,
  template: (id: string) => [...menuKeys.templates(), id] as const,
  activeTemplate: (eventTypeId: string) => [...menuKeys.templates(), 'active', eventTypeId] as const,
  packages: (templateId: string) => [...menuKeys.all, 'packages', templateId] as const,
  package: (id: string) => [...menuKeys.all, 'package', id] as const,
  packageCategories: (packageId: string) => [...menuKeys.all, 'package-categories', packageId] as const,
  options: () => [...menuKeys.all, 'options'] as const,
  option: (id: string) => [...menuKeys.options(), id] as const,
  eventTypes: () => [...menuKeys.all, 'event-types'] as const,
  reservationMenu: (reservationId: string) => [...menuKeys.all, 'reservation', reservationId] as const,
};

// ══════════════════════════════════════════════════════════════════
// MENU TEMPLATES - QUERIES
// ══════════════════════════════════════════════════════════════════

export function useMenuTemplates(filters?: MenuTemplateFilters) {
  return useQuery({
    queryKey: [...menuKeys.templates(), filters],
    queryFn: () => menuApi.getTemplates(filters),
    select: (response) => response.data,
  });
}

export function useMenuTemplate(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.template(id!),
    queryFn: () => menuApi.getTemplate(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useActiveMenuTemplate(eventTypeId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.activeTemplate(eventTypeId!),
    queryFn: () => menuApi.getActiveTemplate(eventTypeId!),
    select: (response) => response.data,
    enabled: !!eventTypeId,
  });
}

// ══════════════════════════════════════════════════════════════════
// MENU TEMPLATES - MUTATIONS
// ══════════════════════════════════════════════════════════════════

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => menuApi.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
      menuApi.updateTemplate(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
      queryClient.invalidateQueries({ queryKey: menuKeys.template(variables.id) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// MENU PACKAGES - QUERIES
// ══════════════════════════════════════════════════════════════════

export function useMenuPackages(templateId: string | undefined | null) {
  return useQuery({
    queryKey: menuKeys.packages(templateId!),
    queryFn: () => menuApi.getPackages(templateId!),
    select: (response) => response.data,
    enabled: !!templateId,
  });
}

export function useMenuPackage(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.package(id!),
    queryFn: () => menuApi.getPackage(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function usePackageCategories(packageId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.packageCategories(packageId!),
    queryFn: () => menuApi.getPackageCategories(packageId!),
    select: (response) => response.data,
    enabled: !!packageId,
  });
}

// ══════════════════════════════════════════════════════════════════
// MENU PACKAGES - MUTATIONS
// ══════════════════════════════════════════════════════════════════

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => menuApi.createPackage(input),
    onSuccess: (response) => {
      const templateId = response.data.menuTemplateId;
      queryClient.invalidateQueries({ queryKey: menuKeys.packages(templateId) });
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
      menuApi.updatePackage(id, data),
    onSuccess: (response, variables) => {
      const templateId = response.data.menuTemplateId;
      queryClient.invalidateQueries({ queryKey: menuKeys.packages(templateId) });
      queryClient.invalidateQueries({ queryKey: menuKeys.package(variables.id) });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, templateId }: { id: string; templateId: string }) => 
      menuApi.deletePackage(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.packages(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// MENU OPTIONS - QUERIES
// ══════════════════════════════════════════════════════════════════

export function useMenuOptions(filters?: MenuOptionFilters) {
  return useQuery({
    queryKey: [...menuKeys.options(), filters],
    queryFn: () => menuApi.getOptions(filters),
    select: (response) => response.data,
  });
}

export function useMenuOption(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.option(id!),
    queryFn: () => menuApi.getOption(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ══════════════════════════════════════════════════════════════════
// MENU OPTIONS - MUTATIONS
// ══════════════════════════════════════════════════════════════════

export function useCreateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => menuApi.createOption(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.options() });
    },
  });
}

export function useUpdateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
      menuApi.updateOption(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.options() });
      queryClient.invalidateQueries({ queryKey: menuKeys.option(variables.id) });
    },
  });
}

export function useDeleteOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuApi.deleteOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.options() });
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// EVENT TYPES
// ══════════════════════════════════════════════════════════════════

export function useEventTypes() {
  return useQuery({
    queryKey: menuKeys.eventTypes(),
    queryFn: async () => {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseURL}/event-types`);
      if (!response.ok) throw new Error('Nie udało się pobrać typów wydarzeń');
      return response.json();
    },
    select: (response) => response.data || response,
  });
}

// ══════════════════════════════════════════════════════════════════
// RESERVATION MENU
// ══════════════════════════════════════════════════════════════════

/**
 * Pobierz menu rezerwacji z podziałem cenowym.
 * Zwraca null gdy menu nie jest wybrane (nie jest to błąd).
 */
export function useReservationMenu(reservationId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.reservationMenu(reservationId!),
    queryFn: async () => {
      try {
        const response = await menuApi.getReservationMenu(reservationId!);
        return response;
      } catch (error: any) {
        // 404 = brak menu — to normalny stan, nie błąd
        if (
          error.response?.status === 404 ||
          error.response?.data?.error?.includes('Menu not selected') ||
          error.response?.data?.error?.includes('Nie znaleziono') ||
          error.message?.includes('Menu not selected')
        ) {
          return null;
        }
        throw error;
      }
    },
    select: (response) => response?.data || null,
    enabled: !!reservationId,
    retry: false,
  });
}

/**
 * Wybierz menu dla rezerwacji
 */
export function useSelectMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      reservationId, 
      selection 
    }: { 
      reservationId: string; 
      selection: MenuSelectionInput 
    }) => menuApi.selectMenu(reservationId, selection),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations', variables.reservationId],
      });
    },
  });
}

/**
 * Zaktualizuj menu rezerwacji
 */
export function useUpdateReservationMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      reservationId, 
      selection 
    }: { 
      reservationId: string; 
      selection: MenuSelectionInput 
    }) => menuApi.updateMenu(reservationId, selection),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations', variables.reservationId],
      });
    },
  });
}

/**
 * Usuń menu rezerwacji
 */
export function useDeleteReservationMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => menuApi.removeMenu(reservationId),
    
    onSuccess: (data, reservationId) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(reservationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations', reservationId],
      });
    },
  });
}

/**
 * Zaktualizuj liczbę gości dla menu rezerwacji
 * Faza C: Invaliduje również query rezerwacji aby odświeżyć totalPrice
 */
export function useUpdateGuestCounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      reservationId, 
      counts 
    }: { 
      reservationId: string;
      counts: {
        adultsCount: number;
        childrenCount: number;
        toddlersCount: number;
      }
    }) => menuApi.updateGuestCounts(reservationId, counts),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations', variables.reservationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations'],
        exact: false,
      });
    },
  });
}

/**
 * Usuń wybór menu z rezerwacji
 * Faza C: Invaliduje również query rezerwacji dla synchronizacji cen
 */
export function useRemoveMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => menuApi.removeMenu(reservationId),
    
    onSuccess: (data, reservationId) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(reservationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['reservations', reservationId],
      });
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ══════════════════════════════════════════════════════════════════

export function useOptionsGroupedByCategory() {
  return useQuery({
    queryKey: [...menuKeys.options(), 'grouped'],
    queryFn: async () => {
      const response = await menuApi.getOptions({ isActive: true });
      const options = response.data;

      const grouped = options.reduce((acc, option) => {
        const category = option.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(option);
        return acc;
      }, {} as Record<string, MenuOption[]>);

      return grouped;
    },
  });
}

export function useHasReservationMenu(reservationId: string | undefined) {
  const { data, isLoading } = useReservationMenu(reservationId);
  return {
    hasMenu: !!data?.snapshot,
    isLoading,
  };
}
