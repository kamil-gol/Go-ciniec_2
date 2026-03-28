// apps/frontend/hooks/use-document-templates.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import type {
  DocumentTemplate,
  DocumentTemplateHistory,
  PreviewResult,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateCategory,
} from '@/types/document-template.types';
import type { MutationError } from '@/types/common.types';

// ── Query Keys ───────────────────────────────────────

const QUERY_KEYS = {
  all: ['document-templates'] as const,
  list: (category?: TemplateCategory) =>
    [...QUERY_KEYS.all, 'list', { category }] as const,
  detail: (slug: string) =>
    [...QUERY_KEYS.all, 'detail', slug] as const,
  history: (slug: string, page: number) =>
    [...QUERY_KEYS.all, 'history', slug, { page }] as const,
};

// ═════════════════════════════════════════════════════════════════
// 📋 QUERIES
// ═════════════════════════════════════════════════════════════════

export function useDocumentTemplates(
  category?: TemplateCategory
): UseQueryResult<DocumentTemplate[]> {
  return useQuery({
    queryKey: QUERY_KEYS.list(category),
    queryFn: async () => {
      const params = category ? `?category=${category}` : '';
      const response = await api.get(`/document-templates${params}`);
      return response.data.data;
    },
    staleTime: 10_000,
  });
}

export function useDocumentTemplate(
  slug: string
): UseQueryResult<DocumentTemplate> {
  return useQuery({
    queryKey: QUERY_KEYS.detail(slug),
    queryFn: async () => {
      const response = await api.get(`/document-templates/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 10_000,
  });
}

export function useTemplateHistory(
  slug: string,
  page: number = 1,
  limit: number = 10
): UseQueryResult<{
  items: DocumentTemplateHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return useQuery({
    queryKey: QUERY_KEYS.history(slug, page),
    queryFn: async () => {
      const response = await api.get(
        `/document-templates/${slug}/history?page=${page}&limit=${limit}`
      );
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 5_000,
  });
}

// ═════════════════════════════════════════════════════════════════
// ✏️ MUTATIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Create a new template.
 */
export function useCreateTemplate(): UseMutationResult<
  DocumentTemplate,
  Error,
  CreateTemplateInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/document-templates', data);
      return response.data.data;
    },
    onSuccess: async (created) => {
      toast.success(
        'Szablon utworzony',
        `${created.name} (${created.slug})`
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
        refetchType: 'all',
      });
    },
    onError: (error: MutationError) => {
      const message =
        error?.response?.data?.error || 'Nie udało się utworzyć szablonu';
      toast.error('Błąd tworzenia', message);
    },
  });
}

/**
 * Update template content (triggers auto-versioning on backend).
 */
export function useUpdateTemplate(): UseMutationResult<
  DocumentTemplate,
  Error,
  { slug: string; data: UpdateTemplateInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, data }) => {
      const response = await api.put(`/document-templates/${slug}`, data);
      return response.data.data;
    },
    onSuccess: async (updated) => {
      toast.success(
        'Szablon zapisany',
        `${updated.name} — wersja ${updated.version}`
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
        refetchType: 'all',
      });
    },
    onError: (error: MutationError) => {
      const message =
        error?.response?.data?.error || 'Nie udało się zapisać szablonu';
      toast.error('Błąd zapisu', message);
    },
  });
}

/**
 * Delete a template (blocked for isRequired templates).
 */
export function useDeleteTemplate(): UseMutationResult<
  { deleted: boolean; slug: string; name: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await api.delete(`/document-templates/${slug}`);
      return response.data.data;
    },
    onSuccess: async (result) => {
      toast.success(
        'Szablon usunięty',
        result.name
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
        refetchType: 'all',
      });
    },
    onError: (error: MutationError) => {
      const message =
        error?.response?.data?.error || 'Nie udało się usunąć szablonu';
      toast.error('Błąd usuwania', message);
    },
  });
}

/**
 * Restore a historical version of a template.
 */
export function useRestoreTemplate(): UseMutationResult<
  DocumentTemplate,
  Error,
  { slug: string; version: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, version }) => {
      const response = await api.post(`/document-templates/${slug}/restore/${version}`);
      return response.data.data;
    },
    onSuccess: async (restored) => {
      toast.success(
        'Wersja przywrócona',
        `${restored.name} — teraz v${restored.version}`
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
        refetchType: 'all',
      });
    },
    onError: (error: MutationError) => {
      const message =
        error?.response?.data?.error || 'Nie udało się przywrócić wersji';
      toast.error('Błąd', message);
    },
  });
}

/**
 * Preview template with variable substitution.
 */
export function usePreviewTemplate(): UseMutationResult<
  PreviewResult,
  Error,
  { slug: string; variables: Record<string, string> }
> {
  return useMutation({
    mutationFn: async ({ slug, variables }) => {
      const response = await api.post(
        `/document-templates/${slug}/preview`,
        { variables }
      );
      return response.data.data;
    },
    onError: (error: MutationError) => {
      const message =
        error?.response?.data?.error || 'Błąd podglądu szablonu';
      toast.error('Błąd', message);
    },
  });
}
