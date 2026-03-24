// apps/backend/src/services/reports-export/excel-menu-preparations.ts

/**
 * Menu preparations report Excel export (#160).
 * Extracted from reports-export.service.ts.
 */

import ExcelJS from 'exceljs';
import type { MenuPreparationsReport } from '@/types/reports.types';
import { portionTargetLabel } from './export.helpers';

export async function exportMenuPreparationsToExcel(report: MenuPreparationsReport): Promise<Buffer> {
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
    // \u2500\u2500 DETAILED: per-reservation with courses & dishes \u2500\u2500
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

        // Courses & dishes \u2014 with portionTarget label
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
    // \u2500\u2500 SUMMARY: 5 columns \u2500\u2500
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
