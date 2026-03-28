import type { DatePreset } from './types';
import { formatCurrency } from '@/lib/utils';

export { formatCurrency };

export const formatPercent = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value}%`;
};

/**
 * Format startTime for display: "16:00" or null/undefined -> ""
 */
export const formatTime = (time: string | null | undefined): string => {
  if (!time) return '';
  return time.substring(0, 5);
};

/**
 * Helper: get Monday of the week containing the given date (ISO week, Monday-based).
 */
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const getDatePresets = (): DatePreset[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const today = formatDateStr(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  const thisMonday = getMonday(now);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const firstDayThisMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDayThisMonth = new Date(year, month + 1, 0);
  const lastDayThisMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayThisMonth.getDate()).padStart(2, '0')}`;

  const firstDayLastMonth = month === 0 ? `${year - 1}-12-01` : `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayLastMonth = new Date(year, month, 0);
  const lastDayLastMonthStr = month === 0
    ? `${year - 1}-12-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`
    : `${year}-${String(month).padStart(2, '0')}-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`;

  return [
    { label: 'Dzi\u015b', dateFrom: today, dateTo: today },
    { label: 'Jutro', dateFrom: tomorrowStr, dateTo: tomorrowStr },
    { label: 'Ten tydzie\u0144', dateFrom: formatDateStr(thisMonday), dateTo: formatDateStr(thisSunday) },
    { label: 'Nast\u0119pny tydzie\u0144', dateFrom: formatDateStr(nextMonday), dateTo: formatDateStr(nextSunday) },
    { label: 'Ten miesi\u0105c', dateFrom: firstDayThisMonth, dateTo: lastDayThisMonthStr },
    { label: 'Poprzedni miesi\u0105c', dateFrom: firstDayLastMonth, dateTo: lastDayLastMonthStr },
    { label: 'Ten rok', dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` },
    { label: 'Ubieg\u0142y rok', dateFrom: `${year - 1}-01-01`, dateTo: `${year - 1}-12-31` },
  ];
};

export const dayNamesPL: Record<string, string> = {
  Sunday: 'Niedziela', Monday: 'Poniedzia\u0142ek', Tuesday: 'Wtorek',
  Wednesday: '\u015aroda', Thursday: 'Czwartek', Friday: 'Pi\u0105tek', Saturday: 'Sobota',
};
