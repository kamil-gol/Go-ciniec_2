// apps/backend/src/services/reports-export.service.ts

/**
 * Reports Export Service
 * Generate Excel (XLSX) and PDF files from report data
 * Updated: extras revenue columns in exports
 * Updated: preparations report PDF export (#159)
 * Updated: preparations report Excel export (#159)
 *
 * PDF generation delegated to pdf.service.ts (Zadanie 4b — #157)
 * Preparations PDF uses standalone module: pdf-preparations.integration.ts (#159)
 * Excel generation remains here (ExcelJS).
 */

import ExcelJS from 'exceljs';
import { pdfService } from './pdf.service';
import { generatePreparationsReportPDF } from './pdf-preparations.integration';
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
    const sheet = workbook.addWorksheet('Raport Przychodów');

    // Set column widths
    sheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 20 },
    ];

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Raport Przychodów';
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

    sheet.addRow(['Całkowity przychód', this.formatCurrency(report.summary.totalRevenue)]);
    sheet.addRow(['Średni przychód na rezerwację', this.formatCurrency(report.summary.avgRevenuePerReservation)]);
    sheet.addRow(['Liczba rezerwacji', report.summary.totalReservations]);
    sheet.addRow(['Ukończone rezerwacje', report.summary.completedReservations]);
    sheet.addRow(['Oczekujący przychód', this.formatCurrency(report.summary.pendingRevenue)]);
    sheet.addRow(['Wzrost %', `${report.summary.growthPercent}%`]);

    // Extras revenue in summary
    const extrasRevenue = (report.summary as any).extrasRevenue;
    if (extrasRevenue !== undefined && extrasRevenue > 0) {
      const extrasRow = sheet.addRow(['Przychody z usług dodatkowych (extras)', this.formatCurrency(extrasRevenue)]);
      extrasRow.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' } };
      extrasRow.getCell(2).font = { bold: true, color: { argb: 'FF7C3AED' } };
    }

    // Breakdown by period
    if (report.breakdown.length > 0) {
      sheet.addRow([]);
      const breakdownHeader = sheet.addRow(['ROZKŁAD WG OKRESU', '']);
      breakdownHeader.font = { bold: true, size: 12 };
      breakdownHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Okres', 'Przychód', 'Liczba', 'Średnia']);
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

      sheet.addRow(['Sala', 'Przychód', 'Liczba', 'Średnia']);
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

      sheet.addRow(['Typ wydarzenia', 'Przychód', 'Liczba', 'Średnia']);
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
      const extrasHeader = sheet.addRow(['PRZYCHODY Z USŁUG DODATKOWYCH', '']);
      extrasHeader.font = { bold: true, size: 12, color: { argb: 'FF7C3AED' } };
      extrasHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F3FF' },
      };

      const colHeader = sheet.addRow(['Usługa', 'Przychód', 'Użyć', 'Śr. przychód']);
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
    const sheet = workbook.addWorksheet('Raport Zajętości');

    // Set column widths
    sheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 20 },
    ];

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Raport Zajętości';
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

    sheet.addRow(['Średnia zajętość', `${report.summary.avgOccupancy}%`]);
    sheet.addRow(['Najpopularniejszy dzień', report.summary.peakDay]);
    sheet.addRow(['Najpopularniejsza sala', report.summary.peakHall || 'Brak danych']);
    sheet.addRow(['Liczba rezerwacji', report.summary.totalReservations]);
    sheet.addRow(['Dni w okresie', report.summary.totalDaysInPeriod]);

    // Halls ranking
    if (report.halls.length > 0) {
      sheet.addRow([]);
      const hallsHeader = sheet.addRow(['ZAJĘTOŚĆ SAL', '']);
      hallsHeader.font = { bold: true, size: 12 };
      hallsHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.addRow(['Sala', 'Zajętość %', 'Rezerwacje', 'Śr. gości']);
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

      sheet.addRow(['Dzień tygodnia', 'Liczba rezerwacji']);
      report.peakDaysOfWeek.forEach(day => {
        sheet.addRow([this.translateDayOfWeek(day.dayOfWeek), day.count]);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ============================================
  // PREPARATIONS EXCEL EXPORT (#159)
  // ============================================

  /**
   * Export preparations report to Excel (XLSX)
   * Supports both detailed and summary views
   */
  async exportPreparationsToExcel(report: PreparationsReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const filters = report.filters;
    const isDetailed = filters.view === 'detailed';

    const sheet = workbook.addWorksheet(
      isDetailed ? 'Przygotowania — Szczegółowy' : 'Przygotowania — Zbiorczy'
    );

    // ── Title ──
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Raport Przygotowań — ${isDetailed ? 'Widok szczegółowy' : 'Widok zbiorczy'}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // ── Filters info ──
    sheet.addRow([]);
    sheet.addRow(['Okres:', `${filters.dateFrom} — ${filters.dateTo}`]);
    sheet.addRow(['Widok:', isDetailed ? 'Szczegółowy' : 'Zbiorczy']);

    // ── Summary KPI ──
    const summary = report.summary;
    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['PODSUMOWANIE', '', '', '', '']);
    summaryHeader.font = { bold: true, size: 12 };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3E8FF' },
    };

    sheet.addRow(['Łączna liczba usług', summary.totalExtras]);
    sheet.addRow(['Rezerwacje z extras', summary.totalReservationsWithExtras]);

    if (summary.topCategory) {
      sheet.addRow(['Top kategoria', `${summary.topCategory.icon} ${summary.topCategory.name} (${summary.topCategory.count})`]);
    }
    if (summary.nearestEvent) {
      sheet.addRow(['Najbliższe wydarzenie', `${summary.nearestEvent.date} ${summary.nearestEvent.startTime} — ${summary.nearestEvent.clientName}`]);
    }

    // ── Data section ──
    sheet.addRow([]);

    if (isDetailed && report.days) {
      // Detailed view — day → category → items
      const dataHeader = sheet.addRow(['SZCZEGÓŁY WG DNI', '', '', '', '']);
      dataHeader.font = { bold: true, size: 12 };
      dataHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.columns = [
        { key: 'col1', width: 35 },
        { key: 'col2', width: 25 },
        { key: 'col3', width: 12 },
        { key: 'col4', width: 18 },
        { key: 'col5', width: 30 },
      ];

      for (const day of report.days) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([`📅 ${day.dateLabel}`, '', '', '', `Usług: ${day.totalItems}`]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        for (const cat of day.categories) {
          const catRow = sheet.addRow([`  ${cat.categoryIcon} ${cat.categoryName}`, '', '', '', '']);
          catRow.font = { bold: true, color: { argb: 'FF7C3AED' } };

          // Column headers for items
          const colRow = sheet.addRow(['  Usługa', 'Rezerwacja', 'Ilość', 'Wartość', 'Uwagi']);
          colRow.font = { bold: true, size: 9 };

          for (const item of cat.items) {
            sheet.addRow([
              `  ${item.serviceName}`,
              `${item.reservation.clientName} (${item.reservation.hallName})`,
              item.quantity,
              item.priceType === 'FREE' ? 'Gratis' : this.formatCurrency(item.totalPrice),
              item.note || '—',
            ]);
          }
        }
      }
    } else if (report.summaryDays) {
      // Summary view — aggregated by day
      const dataHeader = sheet.addRow(['ZESTAWIENIE ZBIORCZE', '', '', '', '']);
      dataHeader.font = { bold: true, size: 12 };
      dataHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.columns = [
        { key: 'col1', width: 35 },
        { key: 'col2', width: 25 },
        { key: 'col3', width: 15 },
        { key: 'col4', width: 15 },
        { key: 'col5', width: 30 },
      ];

      for (const day of report.summaryDays) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([
          `📅 ${day.dateLabel}`,
          '',
          `Usług: ${day.totalItems}`,
          `Rez.: ${day.totalReservations}`,
          '',
        ]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        const colRow = sheet.addRow(['Usługa', 'Kategoria', 'Łącznie szt.', 'Rezerwacji', 'Klienci']);
        colRow.font = { bold: true, size: 9 };

        for (const item of day.items) {
          const clientNames = item.reservations
            .map((r: any) => `${r.clientName} (${r.quantity})`)
            .join(', ');

          sheet.addRow([
            item.serviceName,
            `${item.categoryIcon} ${item.categoryName}`,
            item.totalQuantity,
            item.reservationCount,
            clientNames,
          ]);
        }
      }
    }

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
   * Uses standalone module: pdf-preparations.integration.ts
   * #159 — Raport przygotowań usług dodatkowych
   */
  async exportPreparationsToPDF(report: PreparationsReport): Promise<Buffer> {
    return generatePreparationsReportPDF(report);
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
      'Monday': 'Poniedziałek',
      'Tuesday': 'Wtorek',
      'Wednesday': 'Środa',
      'Thursday': 'Czwartek',
      'Friday': 'Piątek',
      'Saturday': 'Sobota',
      'Sunday': 'Niedziela',
    };
    return translations[day] || day;
  }
}

export default new ReportsExportService();
