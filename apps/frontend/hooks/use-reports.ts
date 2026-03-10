// apps/frontend/hooks/use-reports.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  RevenueReportFilters,
  RevenueReport,
  RevenueReportResponse,
  OccupancyReportFilters,
  OccupancyReport,
  OccupancyReportResponse,
  PreparationsReportFilters,
  PreparationsReport,
  PreparationsReportResponse,
  MenuPreparationsReportFilters,
  MenuPreparationsReport,
  MenuPreparationsReportResponse,
} from '@/types/reports.types';

// ============================================
// REVENUE REPORT HOOK
// ============================================

export function useRevenueReport(
  filters: RevenueReportFilters,
  enabled: boolean = true
): UseQueryResult<RevenueReport> {
  return useQuery({
    queryKey: ['reports', 'revenue', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dateFrom', filters.dateFrom);
      params.append('dateTo', filters.dateTo);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);
      if (filters.hallId) params.append('hallId', filters.hallId);
      if (filters.eventTypeId) params.append('eventTypeId', filters.eventTypeId);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get<RevenueReportResponse>(`/reports/revenue?${params.toString()}`);
      return response.data.data;
    },
    enabled: enabled && !!filters.dateFrom && !!filters.dateTo,
    staleTime: 60000,
    retry: false,
  });
}

// ============================================
// OCCUPANCY REPORT HOOK
// ============================================

export function useOccupancyReport(
  filters: OccupancyReportFilters,
  enabled: boolean = true
): UseQueryResult<OccupancyReport> {
  return useQuery({
    queryKey: ['reports', 'occupancy', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dateFrom', filters.dateFrom);
      params.append('dateTo', filters.dateTo);
      if (filters.hallId) params.append('hallId', filters.hallId);

      const response = await api.get<OccupancyReportResponse>(`/reports/occupancy?${params.toString()}`);
      return response.data.data;
    },
    enabled: enabled && !!filters.dateFrom && !!filters.dateTo,
    staleTime: 60000,
    retry: false,
  });
}

// ============================================
// PREPARATIONS REPORT HOOK (#159)
// ============================================

export function usePreparationsReport(
  filters: PreparationsReportFilters,
  enabled: boolean = true
): UseQueryResult<PreparationsReport> {
  return useQuery({
    queryKey: ['reports', 'preparations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dateFrom', filters.dateFrom);
      params.append('dateTo', filters.dateTo);
      params.append('view', filters.view);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get<PreparationsReportResponse>(`/reports/preparations?${params.toString()}`);
      return response.data.data;
    },
    enabled: enabled && !!filters.dateFrom && !!filters.dateTo,
    staleTime: 60000,
    retry: false,
  });
}

// ============================================
// MENU PREPARATIONS REPORT HOOK (#160)
// ============================================

export function useMenuPreparationsReport(
  filters: MenuPreparationsReportFilters,
  enabled: boolean = true
): UseQueryResult<MenuPreparationsReport> {
  return useQuery({
    queryKey: ['reports', 'menu-preparations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dateFrom', filters.dateFrom);
      params.append('dateTo', filters.dateTo);
      params.append('view', filters.view);

      const response = await api.get<MenuPreparationsReportResponse>(`/reports/menu-preparations?${params.toString()}`);
      return response.data.data;
    },
    enabled: enabled && !!filters.dateFrom && !!filters.dateTo,
    staleTime: 60000,
    retry: false,
  });
}

// ============================================
// EXPORT HELPERS
// ============================================

const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const exportRevenueExcel = (filters: RevenueReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  if (filters.groupBy) params.append('groupBy', filters.groupBy);
  if (filters.hallId) params.append('hallId', filters.hallId);
  if (filters.eventTypeId) params.append('eventTypeId', filters.eventTypeId);
  if (filters.status) params.append('status', filters.status);
  return downloadFile(
    `/reports/export/revenue/excel?${params.toString()}`,
    `raport_przychody_${filters.dateFrom}_${filters.dateTo}.xlsx`
  );
};

export const exportRevenuePDF = (filters: RevenueReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  if (filters.groupBy) params.append('groupBy', filters.groupBy);
  if (filters.hallId) params.append('hallId', filters.hallId);
  if (filters.eventTypeId) params.append('eventTypeId', filters.eventTypeId);
  if (filters.status) params.append('status', filters.status);
  return downloadFile(
    `/reports/export/revenue/pdf?${params.toString()}`,
    `raport_przychody_${filters.dateFrom}_${filters.dateTo}.pdf`
  );
};

export const exportOccupancyExcel = (filters: OccupancyReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  if (filters.hallId) params.append('hallId', filters.hallId);
  return downloadFile(
    `/reports/export/occupancy/excel?${params.toString()}`,
    `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.xlsx`
  );
};

export const exportOccupancyPDF = (filters: OccupancyReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  if (filters.hallId) params.append('hallId', filters.hallId);
  return downloadFile(
    `/reports/export/occupancy/pdf?${params.toString()}`,
    `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.pdf`
  );
};

// ============================================
// PREPARATIONS EXPORT HELPERS (#159)
// ============================================

export const exportPreparationsExcel = (filters: PreparationsReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  params.append('view', filters.view);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  return downloadFile(
    `/reports/export/preparations/excel?${params.toString()}`,
    `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.xlsx`
  );
};

export const exportPreparationsPDF = (filters: PreparationsReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  params.append('view', filters.view);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  return downloadFile(
    `/reports/export/preparations/pdf?${params.toString()}`,
    `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.pdf`
  );
};

// ============================================
// MENU PREPARATIONS EXPORT HELPERS (#160)
// ============================================

export const exportMenuPreparationsExcel = (filters: MenuPreparationsReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  params.append('view', filters.view);
  return downloadFile(
    `/reports/export/menu-preparations/excel?${params.toString()}`,
    `raport_menu_${filters.dateFrom}_${filters.dateTo}.xlsx`
  );
};

export const exportMenuPreparationsPDF = (filters: MenuPreparationsReportFilters) => {
  const params = new URLSearchParams();
  params.append('dateFrom', filters.dateFrom);
  params.append('dateTo', filters.dateTo);
  params.append('view', filters.view);
  return downloadFile(
    `/reports/export/menu-preparations/pdf?${params.toString()}`,
    `raport_menu_${filters.dateFrom}_${filters.dateTo}.pdf`
  );
};
