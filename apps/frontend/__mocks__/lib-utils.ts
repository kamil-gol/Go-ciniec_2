/**
 * Lightweight @/lib/utils stub — implements real logic without date-fns/clsx/tailwind-merge.
 */

/**
 * Merge class names — simplified version without tailwind-merge deduplication.
 * Uses basic dedup: last occurrence of a tailwind prefix wins.
 */
export function cn(...inputs: any[]) {
  const classes = inputs
    .flat(Infinity)
    .filter((x) => typeof x === 'string' && x.length > 0);

  // Simple tailwind-merge: for classes with the same prefix (e.g., px-2, px-4),
  // keep only the last one
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const cls of classes.join(' ').split(/\s+/)) {
    if (!cls) continue;
    // Extract prefix (e.g., "px" from "px-4", "text" from "text-red-500")
    const match = cls.match(/^([a-z]+)-/);
    const prefix = match ? match[1] : cls;

    if (seen.has(prefix)) {
      // Remove old occurrence
      const idx = result.indexOf(seen.get(prefix)!);
      if (idx !== -1) result.splice(idx, 1);
    }
    seen.set(prefix, cls);
    result.push(cls);
  }

  return result.join(' ');
}

/**
 * Format date to Polish locale — without date-fns.
 */
export function formatDate(date: string | Date, formatStr = 'dd.MM.yyyy'): string {
  if (!date) return 'N/A';

  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        dateObj = new Date(date + 'T00:00:00');
      }
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const dd = String(dateObj.getDate()).padStart(2, '0');
    const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateObj.getFullYear());

    return formatStr
      .replace('dd', dd)
      .replace('MM', MM)
      .replace('yyyy', yyyy);
  } catch {
    return 'Invalid date';
  }
}

export function formatTime(time: string): string {
  if (!time) return 'N/A';
  return time.substring(0, 5);
}

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(numAmount);
}

export function calculateTotalPrice(guests: number, pricePerPerson: number | string): number {
  const price = typeof pricePerPerson === 'string' ? parseFloat(pricePerPerson) : pricePerPerson;
  return guests * price;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return (endMinutes - startMinutes) / 60;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Oczekująca',
    CONFIRMED: 'Potwierdzona',
    COMPLETED: 'Zakończona',
    CANCELLED: 'Anulowana',
    ARCHIVED: 'Zarchiwizowana',
  };
  return labels[status] || status;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isPastDate(date: string | Date): boolean {
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00');
    } else {
      dateObj = date;
    }
    return !isNaN(dateObj.getTime()) && dateObj < new Date();
  } catch {
    return false;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
