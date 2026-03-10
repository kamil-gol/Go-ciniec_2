// apps/frontend/hooks/use-catering.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CateringTemplate,
  CateringPackage,
  CateringPackageSection,
  CateringSectionOption,
  CreateCateringTemplateInput,
  UpdateCateringTemplateInput,
  CreateCateringPackageInput,
  UpdateCateringPackageInput,
  CreateCateringSectionInput,
  UpdateCateringSectionInput,
  CreateSectionOptionInput,
  UpdateSectionOptionInput,
} from '@/types/catering.types';

const QUERY_KEYS = {
  templates: ['catering-templates'] as const,
  template: (id: string) => ['catering-templates', id] as const,
  package: (id: string) => ['catering-packages', id] as const,
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATES — Queries
// ═══════════════════════════════════════════════════════════════

export function useCateringTemplates(
  includeInactive = false
): UseQueryResult<CateringTemplate[]> {
  return useQuery({
    queryKey: [...QUERY_KEYS.templates, { includeInactive }],
    queryFn: async () => {
      const params = includeInactive ? '?includeInactive=true' : '';
      const res = await api.get(`/catering/templates${params}`);
      return res.data.data;
    },
    staleTime: 5_000,
  });
}

export function useCateringTemplate(
  id: string
): UseQueryResult<CateringTemplate> {
  return useQuery({
    queryKey: QUERY_KEYS.template(id),
    queryFn: async () => {
      const res = await api.get(`/catering/templates/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateCateringTemplate(): UseMutationResult<
  CateringTemplate,
  Error,
  CreateCateringTemplateInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/catering/templates', data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.templates,
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateCateringTemplate(): UseMutationResult<
  CateringTemplate,
  Error,
  { id: string; data: UpdateCateringTemplateInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/catering/templates/${id}`, data);
      return res.data.data;
    },
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.templates,
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.template(id) });
    },
  });
}

export function useDeleteCateringTemplate(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/catering/templates/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.templates,
        refetchType: 'all',
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PACKAGES — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateCateringPackage(
  templateId: string
): UseMutationResult<CateringPackage, Error, CreateCateringPackageInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/catering/templates/${templateId}/packages`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.templates,
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateCateringPackage(
  templateId: string
): UseMutationResult<
  CateringPackage,
  Error,
  { packageId: string; data: UpdateCateringPackageInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, data }) => {
      const res = await api.patch(
        `/catering/templates/${templateId}/packages/${packageId}`,
        data
      );
      return res.data.data;
    },
    onSuccess: async (_data, { packageId }) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.package(packageId) });
    },
  });
}

export function useDeleteCateringPackage(
  templateId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packageId) => {
      await api.delete(`/catering/templates/${templateId}/packages/${packageId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.templates,
        refetchType: 'all',
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useCreateCateringSection(
  packageId: string,
  templateId: string
): UseMutationResult<CateringPackageSection, Error, CreateCateringSectionInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/catering/packages/${packageId}/sections`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateCateringSection(
  templateId: string
): UseMutationResult<
  CateringPackageSection,
  Error,
  { sectionId: string; data: UpdateCateringSectionInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, data }) => {
      const res = await api.patch(`/catering/sections/${sectionId}`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

export function useDeleteCateringSection(
  templateId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId) => {
      await api.delete(`/catering/sections/${sectionId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

/**
 * PATCH displayOrder dla pojedynczej sekcji po drag & drop.
 * Endpoint: PATCH /catering/sections/:sectionId
 */
export function useReorderCateringSections(
  templateId: string
): UseMutationResult<
  void,
  Error,
  { sectionId: string; displayOrder: number }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, displayOrder }) => {
      await api.patch(`/catering/sections/${sectionId}`, { displayOrder });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'active',
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION OPTIONS — Mutations
// ═══════════════════════════════════════════════════════════════

export function useAddSectionOption(
  sectionId: string,
  templateId: string
): UseMutationResult<CateringSectionOption, Error, CreateSectionOptionInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/catering/sections/${sectionId}/options`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

export function useUpdateSectionOption(
  templateId: string
): UseMutationResult<
  CateringSectionOption,
  Error,
  { optionId: string; data: UpdateSectionOptionInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ optionId, data }) => {
      const res = await api.patch(`/catering/options/${optionId}`, data);
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

export function useRemoveSectionOption(
  templateId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (optionId) => {
      await api.delete(`/catering/options/${optionId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'all',
      });
    },
  });
}

/**
 * PATCH displayOrder dla pojedynczej opcji (dania) po drag & drop.
 * Endpoint: PATCH /catering/options/:optionId
 */
export function useReorderSectionOptions(
  templateId: string
): UseMutationResult<void, Error, { optionId: string; displayOrder: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ optionId, displayOrder }) => {
      await api.patch(`/catering/options/${optionId}`, { displayOrder });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(templateId),
        refetchType: 'active',
      });
    },
  });
}
