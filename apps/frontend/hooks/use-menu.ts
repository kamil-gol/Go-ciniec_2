/**
 * Menu System React Query Hooks
 * 
 * Custom hooks for data fetching and mutations
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

// ════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ════════════════════════════════════════════════════════════════════════════

export const menuKeys = {
  all: ['menu'] as const,
  templates: () => [...menuKeys.all, 'templates'] as const,
  template: (id: string) => [...menuKeys.templates(), id] as const,
  activeTemplate: (eventTypeId: string) => [...menuKeys.templates(), 'active', eventTypeId] as const,
  packages: (templateId: string) => [...menuKeys.all, 'packages', templateId] as const,
  package: (id: string) => [...menuKeys.all, 'package', id] as const,
  options: () => [...menuKeys.all, 'options'] as const,
  option: (id: string) => [...menuKeys.options(), id] as const,
  eventTypes: () => [...menuKeys.all, 'event-types'] as const,
  reservationMenu: (reservationId: string) => [...menuKeys.all, 'reservation', reservationId] as const,
};

// ════════════════════════════════════════════════════════════════════════════
// MENU TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all menu templates
 * 
 * @example
 * const { data, isLoading } = useMenuTemplates({ eventTypeId: '...' });
 */
export function useMenuTemplates(filters?: MenuTemplateFilters) {
  return useQuery({
    queryKey: [...menuKeys.templates(), filters],
    queryFn: () => menuApi.getTemplates(filters),
    select: (response) => response.data,
  });
}

/**
 * Get single menu template
 * 
 * @example
 * const { data } = useMenuTemplate(templateId);
 */
export function useMenuTemplate(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.template(id!),
    queryFn: () => menuApi.getTemplate(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get active menu template for event type
 * 
 * @example
 * const { data } = useActiveMenuTemplate(eventTypeId);
 */
export function useActiveMenuTemplate(eventTypeId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.activeTemplate(eventTypeId!),
    queryFn: () => menuApi.getActiveTemplate(eventTypeId!),
    select: (response) => response.data,
    enabled: !!eventTypeId,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MENU PACKAGES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get packages for menu template
 * 
 * @example
 * const { data } = useMenuPackages(templateId);
 */
export function useMenuPackages(templateId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.packages(templateId!),
    queryFn: () => menuApi.getPackages(templateId!),
    select: (response) => response.data,
    enabled: !!templateId,
  });
}

/**
 * Get single package
 * 
 * @example
 * const { data } = useMenuPackage(packageId);
 */
export function useMenuPackage(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.package(id!),
    queryFn: () => menuApi.getPackage(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MENU OPTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all menu options
 * 
 * @example
 * const { data } = useMenuOptions({ category: 'Alkohol' });
 */
export function useMenuOptions(filters?: MenuOptionFilters) {
  return useQuery({
    queryKey: [...menuKeys.options(), filters],
    queryFn: () => menuApi.getOptions(filters),
    select: (response) => response.data,
  });
}

/**
 * Get single option
 * 
 * @example
 * const { data } = useMenuOption(optionId);
 */
export function useMenuOption(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.option(id!),
    queryFn: () => menuApi.getOption(id!),
    select: (response) => response.data,
    enabled: !!id,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all event types
 * 
 * @example
 * const { data } = useEventTypes();
 */
export function useEventTypes() {
  return useQuery({
    queryKey: menuKeys.eventTypes(),
    queryFn: async () => {
      // Fetch from backend API with fallback URL
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseURL}/event-types`);
      if (!response.ok) throw new Error('Failed to fetch event types');
      return response.json();
    },
    select: (response) => response.data || response,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// RESERVATION MENU
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get reservation menu with price breakdown
 * 
 * @example
 * const { data } = useReservationMenu(reservationId);
 */
export function useReservationMenu(reservationId: string | undefined) {
  return useQuery({
    queryKey: menuKeys.reservationMenu(reservationId!),
    queryFn: () => menuApi.getReservationMenu(reservationId!),
    select: (response) => response.data,
    enabled: !!reservationId,
  });
}

/**
 * Select menu for reservation (mutation)
 * 
 * @example
 * const mutation = useSelectMenu();
 * mutation.mutate({ reservationId, selection });
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
      // Invalidate reservation menu cache
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
      // Also invalidate reservation details
      queryClient.invalidateQueries({
        queryKey: ['reservations', variables.reservationId],
      });
    },
  });
}

/**
 * Update reservation menu (mutation)
 * 
 * @example
 * const mutation = useUpdateReservationMenu();
 * mutation.mutate({ reservationId, selection });
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
      // Invalidate reservation menu cache
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
      // Also invalidate reservation details
      queryClient.invalidateQueries({
        queryKey: ['reservations', variables.reservationId],
      });
    },
  });
}

/**
 * Delete reservation menu (mutation)
 * 
 * @example
 * const mutation = useDeleteReservationMenu();
 * mutation.mutate(reservationId);
 */
export function useDeleteReservationMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => menuApi.removeMenu(reservationId),
    
    onSuccess: (data, reservationId) => {
      // Invalidate reservation menu cache
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(reservationId),
      });
      // Also invalidate reservation details
      queryClient.invalidateQueries({
        queryKey: ['reservations', reservationId],
      });
    },
  });
}

/**
 * Update guest counts for reservation menu (mutation)
 * 
 * @example
 * const mutation = useUpdateGuestCounts();
 * mutation.mutate({ reservationId, counts });
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
      // Invalidate reservation menu cache
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(variables.reservationId),
      });
    },
  });
}

/**
 * Remove menu selection from reservation (mutation)
 * 
 * @example
 * const mutation = useRemoveMenu();
 * mutation.mutate(reservationId);
 */
export function useRemoveMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => menuApi.removeMenu(reservationId),
    
    onSuccess: (data, reservationId) => {
      // Invalidate reservation menu cache
      queryClient.invalidateQueries({
        queryKey: menuKeys.reservationMenu(reservationId),
      });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get options grouped by category
 * 
 * @example
 * const { data: groupedOptions } = useOptionsGroupedByCategory();
 */
export function useOptionsGroupedByCategory() {
  return useQuery({
    queryKey: [...menuKeys.options(), 'grouped'],
    queryFn: async () => {
      const response = await menuApi.getOptions({ isActive: true });
      const options = response.data;

      // Group by category
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

/**
 * Check if reservation has menu selected
 * 
 * @example
 * const hasMenu = useHasReservationMenu(reservationId);
 */
export function useHasReservationMenu(reservationId: string | undefined) {
  const { data, isLoading } = useReservationMenu(reservationId);
  return {
    hasMenu: !!data?.snapshot,
    isLoading,
  };
}
