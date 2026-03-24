// apps/backend/src/services/reports-export/excel-preparations.ts

/**
 * Preparations report Excel export (#159).
 * Extracted from reports-export.service.ts.
 */

import ExcelJS from 'exceljs';
import type { PreparationsReport } from '@/types/reports.types';

export async function exportPreparationsToExcel(report: PreparationsReport): Promise<Buffer> {
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
