// apps/frontend/lib/api/audit-log.ts
// US-9.8: API functions and React Query hooks for entity activity logs

import { apiClient } from '../api-client'
import { useQuery } from '@tanstack/react-query'
import type { AuditLogEntry } from '@/types/audit-log.types'

export const AUDIT_LOG_QUERY_KEY = 'audit-log'

export const auditLogApi = {
  /**
   * Pobiera logi aktywności dla konkretnej encji
   * GET /api/audit-log/entity/:entityType/:entityId
   */
  getEntityLogs: async (entityType: string, entityId: string): Promise<AuditLogEntry[]> => {
    const { data } = await apiClient.get(`/audit-log/entity/${entityType}/${entityId}`)
    return Array.isArray(data) ? data : data.data || []
  },
}

/**
 * Hook: pobiera historię zmian (activity log) dla konkretnej encji
 * Auto-refresh co 30 sekund
 * @param entityType - typ encji (RESERVATION, CLIENT, etc.)
 * @param entityId - ID encji
 */
export const useEntityActivityLog = (entityType: string, entityId: string) => {
  return useQuery({
    queryKey: [AUDIT_LOG_QUERY_KEY, 'entity', entityType, entityId],
    queryFn: () => auditLogApi.getEntityLogs(entityType, entityId),
    enabled: !!entityType && !!entityId,
    refetchInterval: 30000,
  })
}
