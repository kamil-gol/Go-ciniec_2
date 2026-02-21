// apps/frontend/src/hooks/use-service-extras.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ServiceCategory,
  ServiceItem,
  ReservationExtra,
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
  CreateServiceItemInput,
  UpdateServiceItemInput,
  AssignExtraInput,
  BulkAssignExtrasInput,
  UpdateReservationExtraInput,
  ReservationExtrasResponse,
} from '@/types/service-extra.types';

const QUERY_KEYS = {
  categories: ['service-extra-categories'] as const,
  category: (id: string) => ['service-extra-categories', id] as const,
  items: ['service-extra-items'] as const,
  itemsByCategory: (categoryId: string) =>
    ['service-extra-items', 'by-category', categoryId] as const,
  item: (id: string) => ['service-extra-items', id] as const,
  reservationExtras: (reservationId: string) =>
    ['reservation-extras', reservationId] as const,
};

// ═══════════════════════════════════════════════════════════════
// 📁 CATEGORIES — Queries
// ═══════════════════════════════════════════════════════════════

export function useServiceCategories(
  activeOnly: boolean = false
): UseQueryResult<ServiceCategory[]> {
  return useQuery({
    queryKey: [...QUERY_KEYS.categories, { activeOnly }],
    queryFn: async () => {
      const params = activeOnly ? '?activeOnly=true' : '';
      const response = await api.get(`/service-extras/categories${params}`);
      return response.data.data;
    },
    staleTime: 30000,
  });
}

export function useServiceCategory(
  id: string
): UseQueryResult<ServiceCategory> {
  return useQuery({
    queryKey: QUERY_KEYS.category(id),
    queryFn: async () => {
      const response = await api.get(`/service-extras/categories/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

// ═══════════════════════════════════════════════════════════════
// 📁 CATEGORIES — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateCategory(): UseMutationResult<
  ServiceCategory,
  Error,
  CreateServiceCategoryInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServiceCategoryInput) => {
      const response = await api.post('/service-extras/categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  ServiceCategory,
  Error,
  { id: string; data: UpdateServiceCategoryInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/service-extras/categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.category(id) });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service-extras/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useReorderCategories(): UseMutationResult<
  ServiceCategory[],
  Error,
  string[]
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await api.post('/service-extras/categories/reorder', {
        orderedIds,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// 📦 ITEMS — Queries
// ═══════════════════════════════════════════════════════════════

export function useServiceItems(
  activeOnly: boolean = false,
  categoryId?: string
): UseQueryResult<ServiceItem[]> {
  return useQuery({
    queryKey: categoryId
      ? QUERY_KEYS.itemsByCategory(categoryId)
      : [...QUERY_KEYS.items, { activeOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeOnly) params.append('activeOnly', 'true');
      if (categoryId) params.append('categoryId', categoryId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/service-extras/items${query}`);
      return response.data.data;
    },
    staleTime: 30000,
  });
}

export function useServiceItem(id: string): UseQueryResult<ServiceItem> {
  return useQuery({
    queryKey: QUERY_KEYS.item(id),
    queryFn: async () => {
      const response = await api.get(`/service-extras/items/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

// ═══════════════════════════════════════════════════════════════
// 📦 ITEMS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateItem(): UseMutationResult<
  ServiceItem,
  Error,
  CreateServiceItemInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServiceItemInput) => {
      const response = await api.post('/service-extras/items', data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      if (variables.categoryId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.itemsByCategory(variables.categoryId),
        });
      }
    },
  });
}

export function useUpdateItem(): UseMutationResult<
  ServiceItem,
  Error,
  { id: string; data: UpdateServiceItemInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/service-extras/items/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.item(id) });
    },
  });
}

export function useDeleteItem(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service-extras/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// 🔗 RESERVATION EXTRAS — Queries
// ═══════════════════════════════════════════════════════════════

export function useReservationExtras(
  reservationId: string
): UseQueryResult<ReservationExtrasResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.reservationExtras(reservationId),
    queryFn: async () => {
      const response = await api.get(
        `/service-extras/reservations/${reservationId}/extras`
      );
      return response.data;
    },
    enabled: !!reservationId,
    staleTime: 10000,
  });
}

// ═══════════════════════════════════════════════════════════════
// 🔗 RESERVATION EXTRAS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useAssignExtra(
  reservationId: string
): UseMutationResult<ReservationExtra, Error, AssignExtraInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssignExtraInput) => {
      const response = await api.post(
        `/service-extras/reservations/${reservationId}/extras`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reservationExtras(reservationId),
      });
    },
  });
}

export function useBulkAssignExtras(
  reservationId: string
): UseMutationResult<ReservationExtrasResponse, Error, BulkAssignExtrasInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkAssignExtrasInput) => {
      const response = await api.put(
        `/service-extras/reservations/${reservationId}/extras`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reservationExtras(reservationId),
      });
    },
  });
}

export function useUpdateReservationExtra(
  reservationId: string
): UseMutationResult<
  ReservationExtra,
  Error,
  { extraId: string; data: UpdateReservationExtraInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ extraId, data }) => {
      const response = await api.put(
        `/service-extras/reservations/${reservationId}/extras/${extraId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reservationExtras(reservationId),
      });
    },
  });
}

export function useRemoveReservationExtra(
  reservationId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (extraId: string) => {
      await api.delete(
        `/service-extras/reservations/${reservationId}/extras/${extraId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reservationExtras(reservationId),
      });
    },
  });
}
