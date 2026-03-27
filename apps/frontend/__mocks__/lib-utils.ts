/**
 * Lightweight @/lib/utils stub — prevents loading date-fns + clsx + tailwind-merge.
 */
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date, formatStr = 'dd.MM.yyyy') {
  return typeof date === 'string' ? date : date.toISOString();
}

export function formatTime(time: string) {
  return time ? time.substring(0, 5) : 'N/A';
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} PLN`;
}

export function calculateTotalPrice(guests: number, pricePerPerson: number | string) {
  const price = typeof pricePerPerson === 'string' ? parseFloat(pricePerPerson) : pricePerPerson;
  return guests * price;
}

export function calculateDuration(startTime: string, endTime: string) {
  return 0;
}

export function getStatusColor(status: string) {
  return '';
}

export function getStatusLabel(status: string) {
  return status;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  return (...args: Parameters<T>) => func(...args);
}

export function isPastDate(date: string | Date) {
  return false;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}
