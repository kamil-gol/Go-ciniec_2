// apps/backend/src/services/reports/report-helpers.ts

/**
 * Standalone helper functions and constants for reports.
 */

export const DAY_NAMES_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
export const MONTH_NAMES_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

export function formatDateLabelPL(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES_PL[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_PL[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function extractTimeFromDateTime(dt: Date | string | null | undefined): string | null {
  if (!dt) return null;
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  if (isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function calculateExtrasRevenue(
  extras: Array<{ quantity: number; unitPrice: number | null; totalPrice: number | null; serviceItem: { basePrice: number; priceType: string; name: string; id: string } }>,
  guests: number
): { total: number; items: Array<{ serviceItemId: string; name: string; revenue: number }> } {
  let total = 0;
  const items: Array<{ serviceItemId: string; name: string; revenue: number }> = [];

  for (const extra of extras) {
    let revenue = 0;
    if (extra.totalPrice !== null && extra.totalPrice !== undefined) {
      revenue = Number(extra.totalPrice);
    } else {
      const price = extra.unitPrice !== null ? Number(extra.unitPrice) : Number(extra.serviceItem.basePrice);
      const qty = extra.quantity || 1;
      if (extra.serviceItem.priceType === 'PER_PERSON') {
        revenue = price * qty * guests;
      } else if (extra.serviceItem.priceType === 'FREE') {
        revenue = 0;
      } else {
        revenue = price * qty;
      }
    }
    revenue = Math.round(revenue * 100) / 100;
    total += revenue;
    items.push({ serviceItemId: extra.serviceItem.id, name: extra.serviceItem.name, revenue });
  }

  return { total: Math.round(total * 100) / 100, items };
}

export function getClientName(client: { clientType: string; companyName?: string | null; firstName: string; lastName: string }): string {
  if (client.clientType === 'COMPANY' && client.companyName) {
    return client.companyName;
  }
  return `${client.firstName} ${client.lastName}`;
}

export function getReservationDate(r: { date: string | null; startDateTime: Date | string | null }): string {
  if (r.date) return r.date;
  if (r.startDateTime) {
    return new Date(r.startDateTime).toISOString().split('T')[0];
  }
  return '';
}

/**
 * #166: Calculate adult/children portions based on portionTarget.
 * Exported for unit testing.
 */
export function calculatePortions(
  portionTarget: string,
  adults: number,
  children: number,
  portionSize: number
): { adultPortions: number; childrenPortions: number; totalPortions: number } {
  let adultPortions = 0;
  let childrenPortions = 0;

  switch (portionTarget) {
    case 'ADULTS_ONLY':
      adultPortions = adults * portionSize;
      childrenPortions = 0;
      break;
    case 'CHILDREN_ONLY':
      adultPortions = 0;
      childrenPortions = children * portionSize;
      break;
    case 'ALL':
    default:
      adultPortions = adults * portionSize;
      childrenPortions = children * portionSize;
      break;
  }

  return {
    adultPortions,
    childrenPortions,
    totalPortions: adultPortions + childrenPortions,
  };
}
