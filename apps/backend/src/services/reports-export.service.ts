// apps/backend/src/services/reports-export.service.ts

/**
 * Reports Export Service
 * Generate Excel (XLSX) and PDF files from report data
 * Updated: extras revenue columns in exports
 * Updated: preparations report PDF export (#159)
 * Updated: preparations report Excel export (#159)
 * Updated: added Godzina (startTime) column to preparations exports
 * Updated: removed (quantity) from summary Klienci — duplicates Łącznie szt. column
 * Updated: removed PODSUMOWANIE section and nearestEvent from preparations exports
 * Updated: removed Wartość column from preparations exports (ops document, prices in reservation form)
 * Updated: menu preparations Excel + PDF export (#160)
 * FIX: removed Maluchy column from menu preparations summary Excel export
 * FIX: removed Top pakiet from KPI summary + package info from detailed reservation header
 * FIX: removed dish description from detailed menu export
 * FIX: added portionTarget label (dorośli)/(dzieci) to course names in Excel exports
 *
 * PDF generation delegated to pdf.service.ts (Zadanie 4b — #157)
 * Preparations PDF uses standalone module: pdf-preparations.integration.ts (#159)
 * Menu Preparations PDF uses standalone module: pdf-menu-preparations.integration.ts (#160)
 * Excel generation remains here (ExcelJS).
 */

import ExcelJS from 'exceljs';
import { pdfService } from './pdf.service';
import { generatePreparationsReportPDF } from './pdf-preparations.integration';
import { generateMenuPreparationsReportPDF } from './pdf-menu-preparations.integration';
import type {
  RevenueReport,
  OccupancyReport,
  PreparationsReport,
  MenuPreparationsReport,
} from '@/types/reports.types';

/** Helper: translate portionTarget to Polish label for exports */
function portionTargetLabel(target: string | undefined): string {
  if (target === 'ADULTS_ONLY') return ' (doro\u015bli)';
  if (target === 'CHILDREN_ONLY') return ' (dzieci)';
  return '';
}

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
      const extrasRow = sheet.addRow(['Przychody z usług dodatkowych (extras)', this.formatCurrency(extrasRevenue)]);
      extrasRow.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' } };
      extrasRow.getCell(2).font = { bold: true, color: { argb: 'FF7C3AED' } };
    }

    // #216: Category extras revenue in summary
    const categoryExtrasRevenue = (report.summary as any).categoryExtrasRevenue;
    if (categoryExtrasRevenue !== undefined && categoryExtrasRevenue > 0) {
      const catExtrasRow = sheet.addRow(['Przychody z dodatkowo płatnych porcji', this.formatCurrency(categoryExtrasRevenue)]);
      catExtrasRow.getCell(1).font = { bold: true, color: { argb: 'FFD97706' } };
      catExtrasRow.getCell(2).font = { bold: true, color: { argb: 'FFD97706' } };
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

    // #216: Revenue by category extras (dodatkowo płatne porcje)
    const byCategoryExtra = (report as any).byCategoryExtra;
    if (byCategoryExtra && byCategoryExtra.length > 0) {
      sheet.addRow([]);
      const catExtrasHeader = sheet.addRow(['PRZYCHODY Z DODATKOWO PŁATNYCH PORCJI', '']);
      catExtrasHeader.font = { bold: true, size: 12, color: { argb: 'FFD97706' } };
      catExtrasHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' },
      };

      const catColHeader = sheet.addRow(['Kategoria', 'Przychód', 'Łącznie porcji', 'Śr. przychód']);
      catColHeader.font = { bold: true };

      byCategoryExtra.forEach((item: any) => {
        sheet.addRow([
          item.categoryName,
          this.formatCurrency(item.revenue),
          item.totalQuantity,
          this.formatCurrency(item.avgRevenue),
        ]);
      });

      if (categoryExtrasRevenue > 0) {
        const catTotalRow = sheet.addRow(['RAZEM DODATKOWO PŁATNE PORCJE', this.formatCurrency(categoryExtrasRevenue), '', '']);
        catTotalRow.font = { bold: true, color: { argb: 'FFD97706' } };
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
  // PREPARATIONS EXCEL EXPORT (#159)
  // ============================================

  /**
   * Export preparations report to Excel (XLSX)
   * Supports both detailed and summary views
   * Now includes Godzina (startTime) column
   * FIX: removed (quantity) from Klienci column in summary — duplicates Łącznie szt.
   * FIX: removed PODSUMOWANIE section and nearestEvent from preparations exports
   * FIX: removed Warto\u015b\u0107 column — preparations report is for staff ops, prices are in reservation form
   */
  async exportPreparationsToExcel(report: PreparationsReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const filters = report.filters;
    const isDetailed = filters.view === 'detailed';

    const sheet = workbook.addWorksheet(
      isDetailed ? 'Przygotowania \u2014 Szczeg\u00f3\u0142owy' : 'Przygotowania \u2014 Zbiorczy'
    );

    // \u2500\u2500 Title \u2500\u2500
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Raport Przygotowa\u0144 \u2014 ${isDetailed ? 'Widok szczeg\u00f3\u0142owy' : 'Widok zbiorczy'}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // \u2500\u2500 Filters info \u2500\u2500
    sheet.addRow([]);
    sheet.addRow(['Okres:', `${filters.dateFrom} \u2014 ${filters.dateTo}`]);
    sheet.addRow(['Widok:', isDetailed ? 'Szczeg\u00f3\u0142owy' : 'Zbiorczy']);

    // \u2500\u2500 Data section (no PODSUMOWANIE) \u2500\u2500
    sheet.addRow([]);

    if (isDetailed && report.days) {
      const dataHeader = sheet.addRow(['SZCZEG\u00d3\u0141Y WG DNI', '', '', '', '']);
      dataHeader.font = { bold: true, size: 12 };
      dataHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.columns = [
        { key: 'col1', width: 35 },
        { key: 'col2', width: 30 },
        { key: 'col3', width: 12 },
        { key: 'col4', width: 14 },
        { key: 'col5', width: 30 },
      ];

      for (const day of report.days) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([`\ud83d\udcc5 ${day.dateLabel}`, '', '', '', `Us\u0142ug: ${day.totalItems}`]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        for (const cat of day.categories) {
          const catRow = sheet.addRow([`  ${cat.categoryIcon} ${cat.categoryName}`, '', '', '', '']);
          catRow.font = { bold: true, color: { argb: 'FF7C3AED' } };

          const colRow = sheet.addRow(['  Us\u0142uga', 'Rezerwacja', 'Ilo\u015b\u0107', 'Godzina', 'Uwagi']);
          colRow.font = { bold: true, size: 9 };

          for (const item of cat.items) {
            const timeStr = item.reservation.startTime
              ? (item.reservation.endTime
                  ? `${item.reservation.startTime.substring(0, 5)} \u2013 ${item.reservation.endTime.substring(0, 5)}`
                  : item.reservation.startTime.substring(0, 5))
              : '\u2014';

            sheet.addRow([
              `  ${item.serviceName}`,
              `${item.reservation.clientName} (${item.reservation.hallName})`,
              item.quantity,
              timeStr,
              item.note || '\u2014',
            ]);
          }
        }
      }
    } else if (report.summaryDays) {
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
        { key: 'col5', width: 40 },
      ];

      for (const day of report.summaryDays) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([
          `\ud83d\udcc5 ${day.dateLabel}`,
          '',
          `Us\u0142ug: ${day.totalItems}`,
          `Rez.: ${day.totalReservations}`,
          '',
        ]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        const colRow = sheet.addRow(['Us\u0142uga', 'Kategoria', '\u0141\u0105cznie szt.', 'Rezerwacji', 'Klienci']);
        colRow.font = { bold: true, size: 9 };

        for (const item of day.items) {
          const clientNames = item.reservations
            .map((r: any) => {
              const time = r.startTime ? ` ${r.startTime.substring(0, 5)}` : '';
              return `${r.clientName}${time}`;
            })
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
  // MENU PREPARATIONS EXCEL EXPORT (#160)
  // ============================================

  /**
   * Export menu preparations report to Excel (XLSX)
   * Supports both detailed (per-reservation with courses/dishes) and
   * summary (aggregated per course \u2192 per dish with portions) views.
   * Summary: 5 columns \u2014 Danie, Porcje, Doros\u0142e, Dzieci\u0119ce, Klienci (no Maluchy)
   * KPI: no Top pakiet; Detailed: no package info, no dish description
   * FIX: portionTarget label added to course names
   */
  async exportMenuPreparationsToExcel(report: MenuPreparationsReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const filters = report.filters;
    const isDetailed = filters.view === 'detailed';

    const sheet = workbook.addWorksheet(
      isDetailed ? 'Menu \u2014 Szczeg\u00f3\u0142owy' : 'Menu \u2014 Zbiorczy'
    );

    // \u2500\u2500 Title \u2500\u2500
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Raport Menu \u2014 ${isDetailed ? 'Widok szczeg\u00f3\u0142owy' : 'Widok zbiorczy'}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // \u2500\u2500 Filters \u2500\u2500
    sheet.addRow([]);
    sheet.addRow(['Okres:', `${filters.dateFrom} \u2014 ${filters.dateTo}`]);
    sheet.addRow(['Widok:', isDetailed ? 'Szczeg\u00f3\u0142owy' : 'Zbiorczy']);

    // \u2500\u2500 KPI Summary (no Top pakiet) \u2500\u2500
    sheet.addRow([]);
    const kpiHeader = sheet.addRow(['PODSUMOWANIE', '']);
    kpiHeader.font = { bold: true, size: 12 };
    kpiHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' },
    };

    sheet.addRow(['Rezerwacje z menu', report.summary.totalMenus]);
    sheet.addRow(['\u0141\u0105cznie go\u015bci', report.summary.totalGuests]);
    sheet.addRow(['Doro\u015bli', report.summary.totalAdults]);
    sheet.addRow(['Dzieci', report.summary.totalChildren]);
    sheet.addRow(['Maluchy', report.summary.totalToddlers]);

    sheet.addRow([]);

    if (isDetailed && report.days) {
      // \u2500\u2500 DETAILED: per-reservation with courses & dishes (no package, no description) \u2500\u2500
      const dataHeader = sheet.addRow(['SZCZEG\u00d3\u0141Y WG DNI', '', '', '', '']);
      dataHeader.font = { bold: true, size: 12 };
      dataHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.columns = [
        { key: 'col1', width: 30 },
        { key: 'col2', width: 25 },
        { key: 'col3', width: 14 },
        { key: 'col4', width: 20 },
        { key: 'col5', width: 30 },
      ];

      for (const day of report.days) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([
          `\ud83d\udcc5 ${day.dateLabel}`, '', '',
          `Rezerwacji: ${day.totalReservations}`,
          `Go\u015bci: ${day.totalGuests}`,
        ]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        for (const res of day.reservations) {
          // Reservation header \u2014 no package info
          const timeStr = res.startTime
            ? `${res.startTime.substring(0, 5)}${res.endTime ? ' \u2013 ' + res.endTime.substring(0, 5) : ''}`
            : '';
          const guestStr = `${res.guests.total} os. (${res.guests.adults}D + ${res.guests.children}Dz + ${res.guests.toddlers}M)`;

          const resRow = sheet.addRow([
            `  \ud83d\udc64 ${res.clientName}`,
            res.hallName || '',
            timeStr,
            guestStr,
            '',
          ]);
          resRow.font = { bold: true };
          resRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' },
          };

          // Courses & dishes (name only, no description) — with portionTarget label
          for (const course of res.courses) {
            const ptLabel = portionTargetLabel((course as any).portionTarget);
            const courseRow = sheet.addRow([`    \ud83c\udf7d\ufe0f ${course.courseName}${ptLabel}`, '', '', '', '']);
            courseRow.font = { bold: true, color: { argb: 'FFD97706' } };

            for (const dish of course.dishes) {
              sheet.addRow([
                `      \u2022 ${dish.name}`,
                '', '', '', '',
              ]);
            }
          }

          if (res.courses.length === 0) {
            sheet.addRow(['      (brak da\u0144 w menu)', '', '', '', '']);
          }
        }
      }
    } else if (report.summaryDays) {
      // \u2500\u2500 SUMMARY: 5 columns \u2014 Danie, Porcje, Doros\u0142e, Dzieci\u0119ce, Klienci (no Maluchy) \u2500\u2500
      const dataHeader = sheet.addRow(['ZESTAWIENIE ZBIORCZE', '', '', '', '']);
      dataHeader.font = { bold: true, size: 12 };
      dataHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      sheet.columns = [
        { key: 'col1', width: 30 },
        { key: 'col2', width: 15 },
        { key: 'col3', width: 15 },
        { key: 'col4', width: 15 },
        { key: 'col5', width: 45 },
      ];

      for (const day of report.summaryDays) {
        sheet.addRow([]);
        const dayRow = sheet.addRow([
          `\ud83d\udcc5 ${day.dateLabel}`,
          `Rez.: ${day.totalReservations}`,
          `Go\u015bci: ${day.totalGuests}`,
          '', '',
        ]);
        dayRow.font = { bold: true, size: 11 };
        dayRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };

        for (const course of day.courses) {
          const ptLabel = course.dishes.length > 0 ? portionTargetLabel((course.dishes[0] as any).portionTarget) : '';
          const courseRow = sheet.addRow([`  \ud83c\udf7d\ufe0f ${course.courseName}${ptLabel}`, '', '', '', '']);
          courseRow.font = { bold: true, color: { argb: 'FFD97706' } };

          const colRow = sheet.addRow(['  Danie', 'Porcje', 'Doros\u0142e', 'Dzieci\u0119ce', 'Klienci']);
          colRow.font = { bold: true, size: 9 };

          for (const dish of course.dishes) {
            const clientStr = dish.reservations
              .map(r => `${r.clientName} (${r.guests})`)
              .join(', ');

            sheet.addRow([
              `  ${dish.dishName}`,
              dish.totalPortions,
              dish.adultPortions,
              dish.childrenPortions,
              clientStr,
            ]);
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ============================================
  // PDF EXPORTS \u2014 delegated to pdf.service.ts
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
   * #159 \u2014 Raport przygotowa\u0144 us\u0142ug dodatkowych
   */
  async exportPreparationsToPDF(report: PreparationsReport): Promise<Buffer> {
    return generatePreparationsReportPDF(report);
  }

  /**
   * Export menu preparations report to PDF (premium design).
   * Uses standalone module: pdf-menu-preparations.integration.ts
   * #160 \u2014 Raport przygotowa\u0144 menu
   */
  async exportMenuPreparationsToPDF(report: MenuPreparationsReport): Promise<Buffer> {
    return generateMenuPreparationsReportPDF(report);
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
