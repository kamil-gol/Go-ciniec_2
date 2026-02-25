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
  UpdateTemplateInput,
  TemplateCategory,
} from '@/types/document-template.types';

// ── Query Keys ─────────────────────────────────────────

const QUERY_KEYS = {
  all: ['document-templates'] as const,
  list: (category?: TemplateCategory) =>
    [...QUERY_KEYS.all, 'list', { category }] as const,
  detail: (slug: string) =>
    [...QUERY_KEYS.all, 'detail', slug] as const,
  history: (slug: string, page: number) =>
    [...QUERY_KEYS.all, 'history', slug, { page }] as const,
};

// ═══════════════════════════════════════════════════════════════
// 📋 QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * List all templates, optionally filtered by category.
 */
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

/**
 * Get a single template by slug.
 */
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

/**
 * Get paginated change history for a template.
 */
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

// ═══════════════════════════════════════════════════════════════
// ✏️ MUTATIONS
// ═══════════════════════════════════════════════════════════════

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
    onSuccess: async (updated, { slug }) => {
      toast.success(
        'Szablon zapisany',
        `${updated.name} — wersja ${updated.version}`
      );

      // Invalidate all template queries
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.all,
        refetchType: 'all',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || 'Nie udało się zapisać szablonu';
      toast.error('Błąd zapisu', message);
    },
  });
}

/**
 * Preview template with variable substitution.
 * Uses mutation (POST) since it sends data but doesn't persist.
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
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || 'Błąd podglądu szablonu';
      toast.error('Błąd', message);
    },
  });
}
