import type { PortionTarget } from '@/types/menu';

/** #166: Check if category is inactive due to 0 relevant guests */
export function isCategoryInactive(portionTarget: string | undefined, adults: number, childrenCount: number): boolean {
  if (portionTarget === 'ADULTS_ONLY' && adults === 0) return true;
  if (portionTarget === 'CHILDREN_ONLY' && childrenCount === 0) return true;
  return false;
}

export function getInactiveReason(portionTarget: string | undefined): string {
  if (portionTarget === 'ADULTS_ONLY') return 'Brak dorosłych w rezerwacji — kategoria nieaktywna';
  if (portionTarget === 'CHILDREN_ONLY') return 'Brak dzieci w rezerwacji — kategoria nieaktywna';
  return '';
}

/** #216: Calculate guest count based on portionTarget */
export function getGuestCountForTarget(portionTarget: string | undefined, adults: number, childrenCount: number, toddlers: number): number {
  switch (portionTarget) {
    case 'ADULTS_ONLY': return adults;
    case 'CHILDREN_ONLY': return childrenCount;
    case 'ALL':
    default: return adults + childrenCount + toddlers;
  }
}
