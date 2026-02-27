// apps/backend/src/services/reports-export.service.ts

/**
 * Reports Export Service
 * Generate Excel (XLSX) and PDF files from report data
 * Updated: extras revenue columns in exports
 * Updated: preparations report PDF export (#159)
 *
 * PDF generation delegated to pdf.service.ts (Zadanie 4b — #157)
 * Excel generation remains here (ExcelJS).
 */

import ExcelJS from 'exceljs';
import { pdfService } from './pdf.service';
import type {
  RevenueReport,
  OccupancyReport,
  PreparationsReport,
} from '@/types/reports.types';

class ReportsExportService {
  // ============================================
  // EXCEL EXPORTS
  // ============================================

  /**
   * Export revenue report to Excel (XLSX)
   * Now includes extras revenue section
   */
  async exportRevenueToExcel(report: RevenueReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Raport Przychod\u00f3w');

    // Set column widths
    sheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 20 },
    ];

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Raport Przychod\u00f3w';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Filters info
    sheet.addRow([]);
    sheet.addRow(['Okres:', `${report.filters.dateFrom} - ${report.filters.dateTo}`]);
    if (report.filters.groupBy) {
      sheet.addRow(['Grupowanie:', report.filters.groupBy]);
    }

    // Summary section
    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['PODSUMOWANIE', '']);
    summaryHeader.font = { bold: true, size: 12 };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    sheet.addRow(['Ca\u0142kowity przych\u00f3d', this.formatCurrency(report.summary.totalRevenue)]);
    sheet.addRow(['\u015aredni przych\u00f3d na rezerwacj\u0119', this.formatCurrency(report.summary.avgRevenuePerReservation)]);
    sheet.addRow(['Liczba rezerwacji', report.summary.totalReservations]);
    sheet.addRow(['Uko\u0144czone rezerwacje', report.summary.completedReservations]);
    sheet.addRow(['Oczekuj\u0105cy przych\u00f3d', this.formatCurrency(report.summary.pendingRevenue)]);
    sheet.addRow(['Wzrost %', `${report.summary.growthPercent}%`]);

    // Extras revenue in summary
    const extrasRevenue = (report.summary as any).extrasRevenue;
    if (extrasRevenue !== undefined && extrasRevenue > 0) {
      const extrasRow = sheet.addRow(['Przychody z us\u0142ug dodatkowych (extras)', this.formatCurrency(extrasRevenue)]);
      extrasRow.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' } };
      extrasRow.getCell(2).font = { bold: true, color: { argb: 'FF7C3AED' } };
    }

    // Breakdown by period
    if (report.breakdown.length > 0) {
      sheet.addRow([]);
      const breakdownHeader = sheet.addRow(['ROZK\u0141AD WG OKRESU', '']);
      breakdownHeader.font = { bold: true, size: 12 };
      breakdownHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Okres', 'Przych\u00f3d', 'Liczba', '\u015arednia']);
      sheet.columns = [
        { key: 'period', width: 20 },
        { key: 'revenue', width: 20 },
        { key: 'count', width: 15 },
        { key: 'avgRevenue', width: 20 },
      ];

      report.breakdown.forEach(item => {
        sheet.addRow([
          item.period,
          this.formatCurrency(item.revenue),
          item.count,
          this.formatCurrency(item.avgRevenue),
        ]);
      });
    }

    // Revenue by hall
    if (report.byHall.length > 0) {
      sheet.addRow([]);
      const hallHeader = sheet.addRow(['PRZYCHODY WG SAL', '']);
      hallHeader.font = { bold: true, size: 12 };
      hallHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Sala', 'Przych\u00f3d', 'Liczba', '\u015arednia']);
      report.byHall.forEach(item => {
        sheet.addRow([
          item.hallName,
          this.formatCurrency(item.revenue),
          item.count,
          this.formatCurrency(item.avgRevenue),
        ]);
      });
    }

    // Revenue by event type
    if (report.byEventType.length > 0) {
      sheet.addRow([]);
      const eventHeader = sheet.addRow(['PRZYCHODY WG TYPU WYDARZENIA', '']);
      eventHeader.font = { bold: true, size: 12 };
      eventHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Typ wydarzenia', 'Przych\u00f3d', 'Liczba', '\u015arednia']);
      report.byEventType.forEach(item => {
        sheet.addRow([
          item.eventTypeName,
          this.formatCurrency(item.revenue),
          item.count,
          this.formatCurrency(item.avgRevenue),
        ]);
      });
    }

    // Revenue by service item (extras)
    const byServiceItem = (report as any).byServiceItem;
    if (byServiceItem && byServiceItem.length > 0) {
      sheet.addRow([]);
      const extrasHeader = sheet.addRow(['PRZYCHODY Z US\u0141UG DODATKOWYCH', '']);
      extrasHeader.font = { bold: true, size: 12, color: { argb: 'FF7C3AED' } };
      extrasHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F3FF' },
      };

      const colHeader = sheet.addRow(['Us\u0142uga', 'Przych\u00f3d', 'U\u017cy\u0107', '\u015ar. przych\u00f3d']);
      colHeader.font = { bold: true };

      byServiceItem.forEach((item: any) => {
        sheet.addRow([
          item.name,
          this.formatCurrency(item.revenue),
          item.count,
          this.formatCurrency(item.avgRevenue),
        ]);
      });

      // Total row
      if (extrasRevenue > 0) {
        const totalRow = sheet.addRow(['RAZEM EXTRAS', this.formatCurrency(extrasRevenue), '', '']);
        totalRow.font = { bold: true, color: { argb: 'FF7C3AED' } };
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export occupancy report to Excel (XLSX)
   */
  async exportOccupancyToExcel(report: OccupancyReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Raport Zaj\u0119to\u015bci');

    // Set column widths
    sheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 20 },
    ];

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Raport Zaj\u0119to\u015bci';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Filters info
    sheet.addRow([]);
    sheet.addRow(['Okres:', `${report.filters.dateFrom} - ${report.filters.dateTo}`]);

    // Summary section
    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['PODSUMOWANIE', '']);
    summaryHeader.font = { bold: true, size: 12 };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    sheet.addRow(['\u015arednia zaj\u0119to\u015b\u0107', `${report.summary.avgOccupancy}%`]);
    sheet.addRow(['Najpopularniejszy dzie\u0144', report.summary.peakDay]);
    sheet.addRow(['Najpopularniejsza sala', report.summary.peakHall || 'Brak danych']);
    sheet.addRow(['Liczba rezerwacji', report.summary.totalReservations]);
    sheet.addRow(['Dni w okresie', report.summary.totalDaysInPeriod]);

    // Halls ranking
    if (report.halls.length > 0) {
      sheet.addRow([]);
      const hallsHeader = sheet.addRow(['ZAJ\u0118TO\u015a\u0106 SAL', '']);
      hallsHeader.font = { bold: true, size: 12 };
      hallsHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Sala', 'Zaj\u0119to\u015b\u0107 %', 'Rezerwacje', '\u015ar. go\u015bci']);
      sheet.columns = [
        { key: 'hall', width: 25 },
        { key: 'occupancy', width: 15 },
        { key: 'reservations', width: 15 },
        { key: 'avgGuests', width: 15 },
      ];

      report.halls.forEach(hall => {
        sheet.addRow([
          hall.hallName,
          `${hall.occupancy}%`,
          hall.reservations,
          hall.avgGuestsPerReservation,
        ]);
      });
    }

    // Peak hours
    if (report.peakHours.length > 0) {
      sheet.addRow([]);
      const hoursHeader = sheet.addRow(['NAJPOPULARNIEJSZE GODZINY', '']);
      hoursHeader.font = { bold: true, size: 12 };
      hoursHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Godzina', 'Liczba rezerwacji']);
      report.peakHours.forEach(hour => {
        sheet.addRow([`${hour.hour}:00`, hour.count]);
      });
    }

    // Peak days of week
    if (report.peakDaysOfWeek.length > 0) {
      sheet.addRow([]);
      const daysHeader = sheet.addRow(['NAJPOPULARNIEJSZE DNI TYGODNIA', '']);
      daysHeader.font = { bold: true, size: 12 };
      daysHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Dzie\u0144 tygodnia', 'Liczba rezerwacji']);
      report.peakDaysOfWeek.forEach(day => {
        sheet.addRow([this.translateDayOfWeek(day.dayOfWeek), day.count]);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ============================================
  // PDF EXPORTS — delegated to pdf.service.ts
  // ============================================

  /**
   * Export revenue report to PDF (premium design).
   * Delegates to pdfService.generateRevenueReportPDF().
   * Now includes extras revenue section.
   */
  async exportRevenueToPDF(report: RevenueReport): Promise<Buffer> {
    return pdfService.generateRevenueReportPDF(report as any);
  }

  /**
   * Export occupancy report to PDF (premium design).
   * Delegates to pdfService.generateOccupancyReportPDF().
   */
  async exportOccupancyToPDF(report: OccupancyReport): Promise<Buffer> {
    return pdfService.generateOccupancyReportPDF(report as any);
  }

  /**
   * Export preparations report to PDF (premium design).
   * Delegates to pdfService.generatePreparationsReportPDF().
   * #159
   */
  async exportPreparationsToPDF(report: PreparationsReport): Promise<Buffer> {
    return pdfService.generatePreparationsReportPDF(report);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format number as PLN currency
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  }

  /**
   * Translate English day name to Polish
   */
  private translateDayOfWeek(day: string): string {
    const translations: Record<string, string> = {
      'Monday': 'Poniedzia\u0142ek',
      'Tuesday': 'Wtorek',
      'Wednesday': '\u015aroda',
      'Thursday': 'Czwartek',
      'Friday': 'Pi\u0105tek',
      'Saturday': 'Sobota',
      'Sunday': 'Niedziela',
    };
    return translations[day] || day;
  }
}

export default new ReportsExportService();
