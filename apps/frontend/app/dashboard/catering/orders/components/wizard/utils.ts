export function formatPln(value: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
}

export function formatDatePl(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function buildAddress(street: string, number: string, city: string): string {
  const streetPart = [street.trim(), number.trim()].filter(Boolean).join(' ');
  return [streetPart, city.trim()].filter(Boolean).join(', ');
}
