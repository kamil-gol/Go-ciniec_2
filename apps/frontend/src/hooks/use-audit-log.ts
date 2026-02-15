// apps/frontend/src/hooks/use-audit-log.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AuditLogEntry,
  AuditLogResponse,
  AuditLogStatistics,
  AuditLogFilters,
  AuditAction,
  EntityType,
} from '@/types/audit-log.types';

// Lista wszystkich logów z filtrowaniem i paginacją
export function useAuditLogs(
  filters?: AuditLogFilters
): UseQueryResult<AuditLogResponse> {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.action) params.append('action', filters.action);
      if (filters?.entityType) params.append('entityType', filters.entityType);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.entityId) params.append('entityId', filters.entityId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await api.get(`/audit-log?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000, // 30s
  });
}

// Ostatnie N logów (do widgetu dashboard)
export function useRecentAuditLogs(
  limit: number = 10
): UseQueryResult<AuditLogEntry[]> {
  return useQuery({
    queryKey: ['audit-logs', 'recent', limit],
    queryFn: async () => {
      const response = await api.get(`/audit-log/recent?limit=${limit}`);
      return response.data;
    },
    staleTime: 10000, // 10s
  });
}

// Statystyki
export function useAuditLogStatistics(): UseQueryResult<AuditLogStatistics> {
  return useQuery({
    queryKey: ['audit-logs', 'statistics'],
    queryFn: async () => {
      const response = await api.get('/audit-log/statistics');
      return response.data;
    },
    staleTime: 60000, // 1min
  });
}

// Dostępne typy encji
export function useEntityTypes(): UseQueryResult<EntityType[]> {
  return useQuery({
    queryKey: ['audit-logs', 'entity-types'],
    queryFn: async () => {
      const response = await api.get('/audit-log/meta/entity-types');
      return response.data;
    },
    staleTime: Infinity, // Cache forever (rzadko się zmienia)
  });
}

// Dostępne akcje
export function useActions(): UseQueryResult<AuditAction[]> {
  return useQuery({
    queryKey: ['audit-logs', 'actions'],
    queryFn: async () => {
      const response = await api.get('/audit-log/meta/actions');
      return response.data;
    },
    staleTime: Infinity,
  });
}

// Logi dla konkretnej encji
export function useEntityAuditLogs(
  entityType: EntityType,
  entityId: string
): UseQueryResult<AuditLogEntry[]> {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: async () => {
      const response = await api.get(
        `/audit-log/entity/${entityType}/${entityId}`
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 30000,
  });
}
