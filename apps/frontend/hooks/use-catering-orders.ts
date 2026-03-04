// apps/frontend/hooks/use-catering-orders.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CateringOrder,
  CateringOrdersListResponse,
  CateringOrdersFilter,
  CreateCateringOrderInput,
  UpdateCateringOrderInput,
  ChangeStatusInput,
  CreateDepositInput,
  MarkDepositPaidInput,
  CateringOrderHistoryEntry,
} from '@/types/catering-order.types';

const ordersKey = (filter: CateringOrdersFilter) =>
  ['catering-orders', 'list', filter] as unknown[];
const orderKey = (id: string) =>
  ['catering-orders', 'detail', id] as unknown[];
const historyKey = (id: string) =>
  ['catering-orders', 'history', id] as unknown[];

// ═══ Queries ═══════════════════════════════════════════════════════════

export function useCateringOrders(filter: CateringOrdersFilter = {}) {
  return useQuery<CateringOrdersListResponse>({
    queryKey: ordersKey(filter),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.status)        params.set('status', filter.status);
      if (filter.deliveryType)  params.set('deliveryType', filter.deliveryType);
      if (filter.clientId)      params.set('clientId', filter.clientId);
      if (filter.eventDateFrom) params.set('eventDateFrom', filter.eventDateFrom);
      if (filter.eventDateTo)   params.set('eventDateTo', filter.eventDateTo);
      if (filter.search)        params.set('search', filter.search);
      if (filter.page)          params.set('page', String(filter.page));
      if (filter.limit)         params.set('limit', String(filter.limit));
      const qs = params.toString();
      const res = await api.get(`/catering/orders${qs ? `?${qs}` : ''}`);
      return res.data as CateringOrdersListResponse;
    },
    placeholderData: keepPreviousData,
    staleTime: 5_000,
  });
}

export function useCateringOrder(id: string) {
  return useQuery<CateringOrder>({
    queryKey: orderKey(id),
    queryFn: async () => {
      const res = await api.get(`/catering/orders/${id}`);
      return res.data.data as CateringOrder;
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}

export function useCateringOrderHistory(id: string) {
  return useQuery<CateringOrderHistoryEntry[]>({
    queryKey: historyKey(id),
    queryFn: async () => {
      const res = await api.get(`/catering/orders/${id}/history`);
      return res.data.data as CateringOrderHistoryEntry[];
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

// ═══ Mutations ═════════════════════════════════════════════════════════

export function useCreateCateringOrder() {
  const qc = useQueryClient();
  return useMutation<CateringOrder, Error, CreateCateringOrderInput>({
    mutationFn: async (data) => {
      const res = await api.post('/catering/orders', data);
      return res.data.data as CateringOrder;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['catering-orders'] });
    },
  });
}

export function useUpdateCateringOrder(id: string) {
  const qc = useQueryClient();
  return useMutation<CateringOrder, Error, UpdateCateringOrderInput>({
    mutationFn: async (data) => {
      const res = await api.patch(`/catering/orders/${id}`, data);
      return res.data.data as CateringOrder;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: orderKey(id) });
      await qc.invalidateQueries({ queryKey: ['catering-orders'] });
    },
  });
}

export function useChangeCateringOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation<CateringOrder, Error, ChangeStatusInput>({
    mutationFn: async (data) => {
      const res = await api.patch(`/catering/orders/${id}/status`, data);
      return res.data.data as CateringOrder;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: orderKey(id) });
      await qc.invalidateQueries({ queryKey: historyKey(id) });
      await qc.invalidateQueries({ queryKey: ['catering-orders'] });
    },
  });
}

export function useDeleteCateringOrder() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/catering/orders/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['catering-orders'] });
    },
  });
}

export function useCreateCateringDeposit(orderId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, CreateDepositInput>({
    mutationFn: async (data) => {
      const res = await api.post(`/catering/orders/${orderId}/deposits`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: orderKey(orderId) });
    },
  });
}

export function useMarkDepositPaid(orderId: string, depositId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, MarkDepositPaidInput>({
    mutationFn: async (data) => {
      const res = await api.patch(
        `/catering/orders/${orderId}/deposits/${depositId}/pay`,
        data,
      );
      return res.data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: orderKey(orderId) });
    },
  });
}
