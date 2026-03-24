// apps/backend/src/services/reports-export/export.helpers.ts

/**
 * Shared helpers for Excel/PDF report exports.
 */

import type ExcelJS from 'exceljs';

/** Format number as PLN currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
}

/** Translate English day name to Polish */
export function translateDayOfWeek(day: string): string {
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

/** Translate portionTarget to Polish label for exports */
export function portionTargetLabel(target: string | undefined): string {
  if (target === 'ADULTS_ONLY') return ' (doro\u015bli)';
  if (target === 'CHILDREN_ONLY') return ' (dzieci)';
  return '';
}

/** Apply section header styling to a row */
export function applySectionHeader(row: ExcelJS.Row, color?: string): void {
  row.font = { bold: true, size: 12, ...(color ? { color: { argb: color } } : {}) };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
}
