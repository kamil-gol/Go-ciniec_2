// apps/backend/src/services/reports-export/excel-revenue.ts

/**
 * Revenue report Excel export.
 * Extracted from reports-export.service.ts.
 */

import ExcelJS from 'exceljs';
import type { RevenueReport } from '@/types/reports.types';
import { formatCurrency } from './export.helpers';

export async function exportRevenueToExcel(report: RevenueReport): Promise<Buffer> {
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

  sheet.addRow(['Ca\u0142kowity przych\u00f3d', formatCurrency(report.summary.totalRevenue)]);
  sheet.addRow(['\u015aredni przych\u00f3d na rezerwacj\u0119', formatCurrency(report.summary.avgRevenuePerReservation)]);
  sheet.addRow(['Liczba rezerwacji', report.summary.totalReservations]);
  sheet.addRow(['Uko\u0144czone rezerwacje', report.summary.completedReservations]);
  sheet.addRow(['Oczekuj\u0105cy przych\u00f3d', formatCurrency(report.summary.pendingRevenue)]);
  sheet.addRow(['Wzrost %', `${report.summary.growthPercent}%`]);

  // Extras revenue in summary
  const extrasRevenue = (report.summary as any).extrasRevenue;
  if (extrasRevenue !== undefined && extrasRevenue > 0) {
    const extrasRow = sheet.addRow(['Przychody z us\u0142ug dodatkowych (extras)', formatCurrency(extrasRevenue)]);
    extrasRow.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' } };
    extrasRow.getCell(2).font = { bold: true, color: { argb: 'FF7C3AED' } };
  }

  // #216: Category extras revenue in summary
  const categoryExtrasRevenue = (report.summary as any).categoryExtrasRevenue;
  if (categoryExtrasRevenue !== undefined && categoryExtrasRevenue > 0) {
    const catExtrasRow = sheet.addRow(['Przychody z dodatkowo p\u0142atnych porcji', formatCurrency(categoryExtrasRevenue)]);
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
        formatCurrency(item.revenue),
        item.count,
        formatCurrency(item.avgRevenue),
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
        formatCurrency(item.revenue),
        item.count,
        formatCurrency(item.avgRevenue),
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
        formatCurrency(item.revenue),
        item.count,
        formatCurrency(item.avgRevenue),
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
        formatCurrency(item.revenue),
        item.count,
        formatCurrency(item.avgRevenue),
      ]);
    });

    // Total row
    if (extrasRevenue > 0) {
      const totalRow = sheet.addRow(['RAZEM EXTRAS', formatCurrency(extrasRevenue), '', '']);
      totalRow.font = { bold: true, color: { argb: 'FF7C3AED' } };
    }
  }

  // #216: Revenue by category extras (dodatkowo p\u0142atne porcje)
  const byCategoryExtra = (report as any).byCategoryExtra;
  if (byCategoryExtra && byCategoryExtra.length > 0) {
    sheet.addRow([]);
    const catExtrasHeader = sheet.addRow(['PRZYCHODY Z DODATKOWO P\u0141ATNYCH PORCJI', '']);
    catExtrasHeader.font = { bold: true, size: 12, color: { argb: 'FFD97706' } };
    catExtrasHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFBEB' },
    };

    const catColHeader = sheet.addRow(['Kategoria', 'Przych\u00f3d', '\u0141\u0105cznie porcji', '\u015ar. przych\u00f3d']);
    catColHeader.font = { bold: true };

    byCategoryExtra.forEach((item: any) => {
      sheet.addRow([
        item.categoryName,
        formatCurrency(item.revenue),
        item.totalQuantity,
        formatCurrency(item.avgRevenue),
      ]);
    });

    if (categoryExtrasRevenue > 0) {
      const catTotalRow = sheet.addRow(['RAZEM DODATKOWO P\u0141ATNE PORCJE', formatCurrency(categoryExtrasRevenue), '', '']);
      catTotalRow.font = { bold: true, color: { argb: 'FFD97706' } };
    }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
