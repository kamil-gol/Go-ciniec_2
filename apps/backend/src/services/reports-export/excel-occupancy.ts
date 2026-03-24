// apps/backend/src/services/reports-export/excel-occupancy.ts

/**
 * Occupancy report Excel export.
 * Extracted from reports-export.service.ts.
 */

import ExcelJS from 'exceljs';
import type { OccupancyReport } from '@/types/reports.types';
import { formatCurrency, translateDayOfWeek } from './export.helpers';

export async function exportOccupancyToExcel(report: OccupancyReport): Promise<Buffer> {
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
      sheet.addRow([translateDayOfWeek(day.dayOfWeek), day.count]);
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
