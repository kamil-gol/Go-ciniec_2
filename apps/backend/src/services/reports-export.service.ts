// apps/backend/src/services/reports-export.service.ts

/**
 * Reports Export Service
 * Generate Excel (XLSX) and PDF files from report data
 * Updated: extras revenue columns in exports
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type {
  RevenueReport,
  OccupancyReport,
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
  // PDF EXPORTS
  // ============================================

  /**
   * Export revenue report to PDF
   * Now includes extras revenue section
   */
  async exportRevenueToPDF(report: RevenueReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('Raport Przychodów', { align: 'center' });
        doc.moveDown();

        // Filters
        doc.fontSize(10).font('Helvetica');
        doc.text(`Okres: ${report.filters.dateFrom} - ${report.filters.dateTo}`);
        if (report.filters.groupBy) {
          doc.text(`Grupowanie: ${report.filters.groupBy}`);
        }
        doc.moveDown();

        // Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Podsumowanie');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Całkowity przychód: ${this.formatCurrency(report.summary.totalRevenue)}`);
        doc.text(`Średni przychód na rezerwację: ${this.formatCurrency(report.summary.avgRevenuePerReservation)}`);
        doc.text(`Liczba rezerwacji: ${report.summary.totalReservations}`);
        doc.text(`Ukończone rezerwacje: ${report.summary.completedReservations}`);
        doc.text(`Oczekujący przychód: ${this.formatCurrency(report.summary.pendingRevenue)}`);
        doc.text(`Wzrost: ${report.summary.growthPercent}%`);

        // Extras revenue in summary
        const extrasRevenue = (report.summary as any).extrasRevenue;
        if (extrasRevenue !== undefined && extrasRevenue > 0) {
          doc.font('Helvetica-Bold')
            .fillColor('#7C3AED')
            .text(`Przychody z usług dodatkowych: ${this.formatCurrency(extrasRevenue)}`);
          doc.font('Helvetica').fillColor('#000000');
        }
        doc.moveDown();

        // Breakdown by period
        if (report.breakdown.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Rozkład wg okresu');
          doc.fontSize(10).font('Helvetica');
          report.breakdown.slice(0, 10).forEach(item => {
            doc.text(`${item.period}: ${this.formatCurrency(item.revenue)} (${item.count} rez.)`);
          });
          doc.moveDown();
        }

        // By hall
        if (report.byHall.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Przychody wg sal');
          doc.fontSize(10).font('Helvetica');
          report.byHall.slice(0, 10).forEach(item => {
            doc.text(`${item.hallName}: ${this.formatCurrency(item.revenue)} (${item.count} rez.)`);
          });
          doc.moveDown();
        }

        // By event type
        if (report.byEventType.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Przychody wg typu wydarzenia');
          doc.fontSize(10).font('Helvetica');
          report.byEventType.slice(0, 10).forEach(item => {
            doc.text(`${item.eventTypeName}: ${this.formatCurrency(item.revenue)} (${item.count} rez.)`);
          });
          doc.moveDown();
        }

        // By service item (extras)
        const byServiceItem = (report as any).byServiceItem;
        if (byServiceItem && byServiceItem.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
            .fillColor('#7C3AED')
            .text('Usługi dodatkowe — przychody');
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          byServiceItem.slice(0, 15).forEach((item: any) => {
            doc.text(`${item.name}: ${this.formatCurrency(item.revenue)} (${item.count}× użyte, śr. ${this.formatCurrency(item.avgRevenue)})`);
          });
          if (extrasRevenue > 0) {
            doc.font('Helvetica-Bold')
              .fillColor('#7C3AED')
              .text(`Razem extras: ${this.formatCurrency(extrasRevenue)}`);
            doc.font('Helvetica').fillColor('#000000');
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export occupancy report to PDF
   */
  async exportOccupancyToPDF(report: OccupancyReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('Raport Zajętości', { align: 'center' });
        doc.moveDown();

        // Filters
        doc.fontSize(10).font('Helvetica');
        doc.text(`Okres: ${report.filters.dateFrom} - ${report.filters.dateTo}`);
        doc.moveDown();

        // Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Podsumowanie');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Średnia zajętość: ${report.summary.avgOccupancy}%`);
        doc.text(`Najpopularniejszy dzień: ${this.translateDayOfWeek(report.summary.peakDay)}`);
        doc.text(`Najpopularniejsza sala: ${report.summary.peakHall || 'Brak danych'}`);
        doc.text(`Liczba rezerwacji: ${report.summary.totalReservations}`);
        doc.text(`Dni w okresie: ${report.summary.totalDaysInPeriod}`);
        doc.moveDown();

        // Halls ranking
        if (report.halls.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Zajętość sal');
          doc.fontSize(10).font('Helvetica');
          report.halls.slice(0, 10).forEach(hall => {
            doc.text(`${hall.hallName}: ${hall.occupancy}% (${hall.reservations} rez., śr. ${hall.avgGuestsPerReservation} gości)`);
          });
          doc.moveDown();
        }

        // Peak hours
        if (report.peakHours.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Najpopularniejsze godziny');
          doc.fontSize(10).font('Helvetica');
          report.peakHours.slice(0, 10).forEach(hour => {
            doc.text(`${hour.hour}:00 - ${hour.count} rezerwacji`);
          });
          doc.moveDown();
        }

        // Peak days
        if (report.peakDaysOfWeek.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Najpopularniejsze dni tygodnia');
          doc.fontSize(10).font('Helvetica');
          report.peakDaysOfWeek.forEach(day => {
            doc.text(`${this.translateDayOfWeek(day.dayOfWeek)}: ${day.count} rezerwacji`);
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
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
