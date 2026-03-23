// apps/frontend/components/audit-log/details/formatters.ts

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { fieldLabels, enumTranslations } from './constants';

// ─── Value formatting helpers ────────────────────────────────────────────────

export function getFieldLabel(key: string): string {
  return fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

/** Extract a meaningful human-readable label from an object */
export function formatObjectSummary(obj: Record<string, any>): string {
  if (obj.name) return String(obj.name);
  if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`;
  if (obj.firstName) return String(obj.firstName);
  if (obj.email) return String(obj.email);
  if (obj.title) return String(obj.title);

  // Fallback: show up to 3 most meaningful fields
  const skipKeys = new Set(['id', 'createdAt', 'updatedAt', '_count']);
  const entries = Object.entries(obj).filter(([k]) => !skipKeys.has(k));
  if (entries.length === 0) return 'Brak danych';

  const parts = entries.slice(0, 3).map(([k, v]) => {
    const label = getFieldLabel(k);
    if (v === null || v === undefined) return `${label}: —`;
    if (typeof v === 'boolean') return `${label}: ${v ? 'Tak' : 'Nie'}`;
    if (typeof v === 'object') return `${label}: ...`;
    return `${label}: ${String(v)}`;
  });
  return parts.join(', ');
}

/** Extract meaningful labels from an array of objects */
export function formatArraySummary(arr: any[]): string {
  if (arr.length === 0) return 'Brak';
  if (typeof arr[0] !== 'object') return arr.join(', ');

  const names = arr.map((item) => {
    if (item.name) return item.name;
    if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
    if (item.firstName) return item.firstName;
    if (item.email) return item.email;
    if (item.itemName) return item.itemName;
    if (item.clientName) return item.clientName;
    if (item.originalName) return item.originalName;
    if (item.orderNumber) return `#${item.orderNumber}`;
    // For extras-like objects with quantity/price
    if (item.quantity != null && item.pricePerItem != null) {
      return `${item.quantity} × ${Number(item.pricePerItem).toLocaleString('pl-PL')} zł`;
    }
    if (item.quantity != null && item.totalPrice != null) {
      return `${item.quantity} szt. (${Number(item.totalPrice).toLocaleString('pl-PL')} zł)`;
    }
    // Fallback: try to get a meaningful summary
    return formatObjectSummary(item);
  });

  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} (+${names.length - 3})`;
}

export function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return '—';
  if (value === true) return 'Tak';
  if (value === false) return 'Nie';

  const str = String(value);

  // Translate known enum values (statuses, payment methods, types, etc.)
  if (typeof value === 'string' && enumTranslations[str]) {
    return enumTranslations[str];
  }

  // Currency amounts (numeric fields with money-related names)
  if (typeof value === 'number' && /amount|price|Price|Rate/.test(fieldName || '')) {
    return `${value.toLocaleString('pl-PL')} zł`;
  }

  // Percentage
  if (typeof value === 'number' && fieldName === 'discountValue') {
    return `${value}%`;
  }

  // File sizes
  if (typeof value === 'number' && /size|Bytes/.test(fieldName || '')) {
    if (value > 1048576) return `${(value / 1048576).toFixed(1)} MB`;
    if (value > 1024) return `${(value / 1024).toFixed(0)} KB`;
    return `${value} B`;
  }

  // Date strings (ISO format)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) {
    try {
      return format(new Date(value), 'd MMMM yyyy, HH:mm', { locale: pl });
    } catch {
      return str;
    }
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      return format(new Date(value + 'T00:00:00'), 'd MMMM yyyy', { locale: pl });
    } catch {
      return str;
    }
  }

  // Arrays
  if (Array.isArray(value)) {
    return formatArraySummary(value);
  }

  // Objects — extract meaningful data
  if (typeof value === 'object') {
    return formatObjectSummary(value);
  }

  return str;
}

// ─── Detect if changes object uses {old, new} format (from diffObjects) ─────

export function isDiffFormat(changes: Record<string, any>): boolean {
  const keys = Object.keys(changes);
  if (keys.length === 0) return false;
  return keys.slice(0, 3).every(
    (k) => changes[k] && typeof changes[k] === 'object' && !Array.isArray(changes[k]) && ('old' in changes[k] || 'new' in changes[k])
  );
}
