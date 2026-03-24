// apps/backend/src/services/reports-export.service.ts

/**
 * Reports Export Service
 * Generate Excel (XLSX) and PDF files from report data.
 *
 * Decomposed: Excel builders extracted to reports-export/ sub-modules.
 * PDF generation delegated to pdf.service.ts / standalone integration modules.
 * This file is a thin facade preserving the original public API.
 */

import { pdfService } from './pdf.service';
import { generatePreparationsReportPDF } from './pdf-preparations.integration';
import { generateMenuPreparationsReportPDF } from './pdf-menu-preparations.integration';
import type {
  RevenueReport,
  OccupancyReport,
  PreparationsReport,
  MenuPreparationsReport,
} from '@/types/reports.types';

import { exportRevenueToExcel } from './reports-export/excel-revenue';
import { exportOccupancyToExcel } from './reports-export/excel-occupancy';
import { exportPreparationsToExcel } from './reports-export/excel-preparations';
import { exportMenuPreparationsToExcel } from './reports-export/excel-menu-preparations';

class ReportsExportService {
  // ============================================
  // EXCEL EXPORTS — delegated to sub-modules
  // ============================================

  exportRevenueToExcel(report: RevenueReport): Promise<Buffer> {
    return exportRevenueToExcel(report);
  }

  exportOccupancyToExcel(report: OccupancyReport): Promise<Buffer> {
    return exportOccupancyToExcel(report);
  }

  exportPreparationsToExcel(report: PreparationsReport): Promise<Buffer> {
    return exportPreparationsToExcel(report);
  }

  exportMenuPreparationsToExcel(report: MenuPreparationsReport): Promise<Buffer> {
    return exportMenuPreparationsToExcel(report);
  }

  // ============================================
  // PDF EXPORTS — delegated to pdf.service.ts
  // ============================================

  async exportRevenueToPDF(report: RevenueReport): Promise<Buffer> {
    return pdfService.generateRevenueReportPDF(report as any);
  }

  async exportOccupancyToPDF(report: OccupancyReport): Promise<Buffer> {
    return pdfService.generateOccupancyReportPDF(report as any);
  }

  async exportPreparationsToPDF(report: PreparationsReport): Promise<Buffer> {
    return generatePreparationsReportPDF(report);
  }

  async exportMenuPreparationsToPDF(report: MenuPreparationsReport): Promise<Buffer> {
    return generateMenuPreparationsReportPDF(report);
  }
}

export default new ReportsExportService();
