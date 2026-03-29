/**
 * Reservation Utilities
 * Helper functions for reservation business logic
 */

import { CreateReservationDTO, UpdateReservationDTO } from '../types/reservation.types';

/**
 * Calculate total number of guests (including toddlers)
 */
export function calculateTotalGuests(adults: number, children: number, toddlers: number = 0): number {
  return adults + children + toddlers;
}

/**
 * Calculate total price based on guests and pricing (including toddlers)
 */
export function calculateTotalPrice(
  adults: number,
  children: number,
  pricePerAdult: number,
  pricePerChild: number,
  toddlers: number = 0,
  pricePerToddler: number = 0
): number {
  return (adults * pricePerAdult) + (children * pricePerChild) + (toddlers * pricePerToddler);
}

/**
 * Calculate event duration in hours
 */
export function calculateDuration(startDateTime: Date, endDateTime: Date): number {
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  return durationMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Check if event duration exceeds default hours and generate note
 */
export function generateExtraHoursNote(startDateTime: Date, endDateTime: Date, defaultHours: number = 6): string | null {
  const duration = calculateDuration(startDateTime, endDateTime);
  
  if (duration > defaultHours) {
    const extraHours = Math.ceil(duration - defaultHours);
    return `\n\n⏰ Uwaga: Wydarzenie trwa ${extraHours}h dłużej niż standardowe ${defaultHours}h. Klient musi dopłacić za ${extraHours} dodatkowych godzin.`;
  }
  
  return null;
}

/**
 * Validate confirmation deadline (must be at least 1 day before event)
 */
export function validateConfirmationDeadline(confirmationDeadline: Date, eventStartDateTime: Date): boolean {
  const oneDayBefore = new Date(eventStartDateTime);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  
  return confirmationDeadline <= oneDayBefore;
}

/**
 * Validate custom event type fields
 */
export function validateCustomEventFields(
  eventTypeName: string,
  data: CreateReservationDTO | UpdateReservationDTO
): { valid: boolean; error?: string } {
  // Check for "Rocznica" event type
  if (eventTypeName === 'Rocznica') {
    if (!data.anniversaryYear) {
      return { valid: false, error: 'Pole "Która rocznica" jest wymagane dla typu wydarzenia "Rocznica"' };
    }
    if (!data.anniversaryOccasion) {
      return { valid: false, error: 'Pole "Jaka okazja" jest wymagane dla typu wydarzenia "Rocznica"' };
    }
  }
  
  // Check for "Inne" event type
  if (eventTypeName === 'Inne') {
    if (!data.customEventType) {
      return { valid: false, error: 'Pole "Typ wydarzenia" jest wymagane dla typu wydarzenia "Inne"' };
    }
  }
  
  return { valid: true };
}

/**
 * Detect changes between old and new reservation data
 */
export function detectReservationChanges(
  oldData: Record<string, unknown>,
  newData: UpdateReservationDTO
): Array<{ field: string; oldValue: unknown; newValue: unknown; label: string }> {
  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown; label: string }> = [];
  
  // Compare startDateTime
  if (newData.startDateTime && newData.startDateTime !== oldData.startDateTime?.toISOString()) {
    changes.push({
      field: 'startDateTime',
      oldValue: oldData.startDateTime,
      newValue: newData.startDateTime,
      label: 'Data i godzina rozpoczęcia'
    });
  }
  
  // Compare endDateTime
  if (newData.endDateTime && newData.endDateTime !== oldData.endDateTime?.toISOString()) {
    changes.push({
      field: 'endDateTime',
      oldValue: oldData.endDateTime,
      newValue: newData.endDateTime,
      label: 'Data i godzina zakończenia'
    });
  }
  
  // Compare adults
  if (newData.adults !== undefined && newData.adults !== oldData.adults) {
    changes.push({
      field: 'adults',
      oldValue: oldData.adults,
      newValue: newData.adults,
      label: 'Liczba dorosłych'
    });
  }
  
  // Compare children
  if (newData.children !== undefined && newData.children !== oldData.children) {
    changes.push({
      field: 'children',
      oldValue: oldData.children,
      newValue: newData.children,
      label: 'Liczba dzieci (4-12)'
    });
  }
  
  // Compare toddlers
  if (newData.toddlers !== undefined && newData.toddlers !== oldData.toddlers) {
    changes.push({
      field: 'toddlers',
      oldValue: oldData.toddlers,
      newValue: newData.toddlers,
      label: 'Liczba dzieci (0-3)'
    });
  }
  
  // Compare pricePerAdult
  if (newData.pricePerAdult !== undefined && newData.pricePerAdult !== Number(oldData.pricePerAdult)) {
    changes.push({
      field: 'pricePerAdult',
      oldValue: oldData.pricePerAdult,
      newValue: newData.pricePerAdult,
      label: 'Cena za dorosłego'
    });
  }
  
  // Compare pricePerChild
  if (newData.pricePerChild !== undefined && newData.pricePerChild !== Number(oldData.pricePerChild)) {
    changes.push({
      field: 'pricePerChild',
      oldValue: oldData.pricePerChild,
      newValue: newData.pricePerChild,
      label: 'Cena za dziecko (4-12)'
    });
  }
  
  // Compare pricePerToddler
  if (newData.pricePerToddler !== undefined && newData.pricePerToddler !== Number(oldData.pricePerToddler)) {
    changes.push({
      field: 'pricePerToddler',
      oldValue: oldData.pricePerToddler,
      newValue: newData.pricePerToddler,
      label: 'Cena za dziecko (0-3)'
    });
  }
  
  // Compare confirmationDeadline
  if (newData.confirmationDeadline && newData.confirmationDeadline !== oldData.confirmationDeadline?.toISOString()) {
    changes.push({
      field: 'confirmationDeadline',
      oldValue: oldData.confirmationDeadline,
      newValue: newData.confirmationDeadline,
      label: 'Termin potwierdzenia'
    });
  }
  
  // Compare customEventType
  if (newData.customEventType !== undefined && newData.customEventType !== oldData.customEventType) {
    changes.push({
      field: 'customEventType',
      oldValue: oldData.customEventType,
      newValue: newData.customEventType,
      label: 'Własny typ wydarzenia'
    });
  }
  
  // Compare anniversaryYear
  if (newData.anniversaryYear !== undefined && newData.anniversaryYear !== oldData.anniversaryYear) {
    changes.push({
      field: 'anniversaryYear',
      oldValue: oldData.anniversaryYear,
      newValue: newData.anniversaryYear,
      label: 'Która rocznica'
    });
  }
  
  // Compare anniversaryOccasion
  if (newData.anniversaryOccasion !== undefined && newData.anniversaryOccasion !== oldData.anniversaryOccasion) {
    changes.push({
      field: 'anniversaryOccasion',
      oldValue: oldData.anniversaryOccasion,
      newValue: newData.anniversaryOccasion,
      label: 'Okazja rocznicy'
    });
  }
  
  // Compare notes
  if (newData.notes !== undefined && newData.notes !== oldData.notes) {
    changes.push({
      field: 'notes',
      oldValue: oldData.notes,
      newValue: newData.notes,
      label: 'Notatki'
    });
  }
  
  return changes;
}

/**
 * Format changes summary for display
 */
export function formatChangesSummary(
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown; label: string }>
): string {
  if (changes.length === 0) {
    return 'Brak zmian';
  }
  
  return changes.map(change => {
    return `• ${change.label}: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
  }).join('\n');
}

/**
 * Calculate extrasTotalPrice from reservation extras array.
 * Supports FLAT (basePrice x quantity), PER_PERSON (basePrice x quantity x guests), FREE (0).
 */
export function calculateExtrasTotalPrice(
  extras: Array<{ quantity: number; customPrice: number | null; serviceItem: { basePrice: number; priceType: string } }>,
  guests: number
): number {
  let total = 0;
  for (const extra of extras) {
    const price = extra.customPrice !== null ? Number(extra.customPrice) : Number(extra.serviceItem.basePrice);
    const qty = extra.quantity || 1;

    if (extra.serviceItem.priceType === 'PER_PERSON') {
      total += price * qty * guests;
    } else if (extra.serviceItem.priceType === 'FREE') {
      // free — no cost
    } else {
      // FLAT
      total += price * qty;
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Enrich a reservation record with computed extras totals.
 * Used by getReservations (list) and getReservationById (detail).
 */
export function enrichWithExtrasTotals(reservation: Record<string, unknown>): Record<string, unknown> {
  const rawExtras = (reservation.extras || []).map((e: Record<string, unknown>) => ({
    quantity: e.quantity,
    customPrice: null as number | null,
    serviceItem: { basePrice: Number(e.serviceItem.basePrice), priceType: e.serviceItem.priceType },
  }));
  const extrasTotalPrice = calculateExtrasTotalPrice(rawExtras, reservation.guests || 0);
  const categoryExtras = reservation.categoryExtras || [];
  const categoryExtrasTotal = categoryExtras.reduce(
    (sum: number, e: any) => sum + Number(e.totalPrice), 0
  );
  return {
    ...reservation,
    extrasTotalPrice,
    extrasCount: rawExtras.length,
    categoryExtras,
    categoryExtrasTotal,
  };
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'brak';
  }
  
  if (value instanceof Date) {
    return value.toLocaleString('pl-PL');
  }
  
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...';
  }
  
  return String(value);
}
