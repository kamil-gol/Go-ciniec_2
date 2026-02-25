// apps/frontend/src/hooks/use-clients.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Client,
  ClientContact,
  CreateClientInput,
  UpdateClientInput,
  CreateClientContactInput,
  UpdateClientContactInput,
  ClientsFilterParams,
} from '@/types/client.types';

const QUERY_KEYS = {
  clients: ['clients'] as const,
  client: (id: string) => ['clients', id] as const,
};

// ═══════════════════════════════════════════════════════════════
// 👥 CLIENTS — Queries
// ═══════════════════════════════════════════════════════════════

export function useClients(
  filters?: ClientsFilterParams
): UseQueryResult<Client[]> {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.clientType) params.append('clientType', filters.clientType);
      if (filters?.includeDeleted) params.append('includeDeleted', 'true');
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/clients${query}`);
      return response.data.data;
    },
    staleTime: 5_000,
  });
}

export function useClient(id: string): UseQueryResult<Client> {
  return useQuery({
    queryKey: QUERY_KEYS.client(id),
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}

// ═══════════════════════════════════════════════════════════════
// 👥 CLIENTS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateClient(): UseMutationResult<
  Client,
  Error,
  CreateClientInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const response = await api.post('/clients', data);
      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateClient(): UseMutationResult<
  Client,
  Error,
  { id: string; data: UpdateClientInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/clients/${id}`, data);
      return response.data.data;
    },
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.client(id) });
    },
  });
}

export function useDeleteClient(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// 📇 CONTACTS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useAddContact(): UseMutationResult<
  ClientContact,
  Error,
  { clientId: string; data: CreateClientContactInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }) => {
      const response = await api.post(`/clients/${clientId}/contacts`, data);
      return response.data.data;
    },
    onSuccess: async (_data, { clientId }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.client(clientId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateContact(): UseMutationResult<
  ClientContact,
  Error,
  { clientId: string; contactId: string; data: UpdateClientContactInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, contactId, data }) => {
      const response = await api.put(
        `/clients/${clientId}/contacts/${contactId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: async (_data, { clientId }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.client(clientId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
    },
  });
}

export function useRemoveContact(): UseMutationResult<
  void,
  Error,
  { clientId: string; contactId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, contactId }) => {
      await api.delete(`/clients/${clientId}/contacts/${contactId}`);
    },
    onSuccess: async (_data, { clientId }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.client(clientId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clients,
        refetchType: 'all',
      });
    },
  });
}
