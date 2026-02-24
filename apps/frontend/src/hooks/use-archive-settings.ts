/**
 * Archive Settings Hook — #144 Phase 4
 *
 * React Query hooks for archive admin endpoints:
 *   GET  /settings/archive     → useArchiveSettings()
 *   PUT  /settings/archive     → useUpdateArchiveDays()
 *   POST /settings/archive/run-now → useRunArchiveNow()
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ───────────────────────────────────────────────

export interface ArchiveSettingsData {
  archiveAfterDays: number;
  pendingCandidatesCount: number;
  totalCancelledCount: number;
  archivedTotalCount: number;
  cutoffDate: string;
}

export interface ArchiveRunResult {
  archivedCount: number;
  archivedIds: string[];
  archiveAfterDays: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ── Query keys ──────────────────────────────────────────

const ARCHIVE_SETTINGS_KEY = ['archive-settings'] as const;

// ── Hooks ───────────────────────────────────────────────

/**
 * Fetch current archive settings + statistics.
 */
export function useArchiveSettings() {
  return useQuery({
    queryKey: ARCHIVE_SETTINGS_KEY,
    queryFn: async (): Promise<ArchiveSettingsData> => {
      const response = await apiClient.get<ApiResponse<ArchiveSettingsData>>('/settings/archive');
      return response.data.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Update archiveAfterDays setting.
 * Invalidates settings query on success.
 */
export function useUpdateArchiveDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (archiveAfterDays: number): Promise<ApiResponse<{ archiveAfterDays: number }>> => {
      const response = await apiClient.put('/settings/archive', { archiveAfterDays });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARCHIVE_SETTINGS_KEY });
    },
  });
}

/**
 * Trigger manual archive run.
 * Invalidates settings query on success (counts will change).
 */
export function useRunArchiveNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ApiResponse<ArchiveRunResult>> => {
      const response = await apiClient.post('/settings/archive/run-now');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARCHIVE_SETTINGS_KEY });
    },
  });
}
