/**
 * Reservation Prisma Include Objects
 * Reusable include/select definitions for reservation queries.
 * Extracted from reservation.service.ts
 */

/**
 * Standard include for basic reservation queries (list, create, update).
 */
export const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true, allowMultipleBookings: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true, standardHours: true, extraHourRate: true } },
  createdBy: { select: { id: true, email: true } },
} as const;

/**
 * Extended include for getReservations list (with extras + categoryExtras).
 */
export const RESERVATION_LIST_INCLUDE = {
  ...RESERVATION_INCLUDE,
  extras: {
    include: {
      serviceItem: { select: { id: true, name: true, basePrice: true, priceType: true } },
    },
  },
  categoryExtras: {
    include: {
      packageCategory: {
        include: { category: { select: { id: true, name: true, icon: true } } },
      },
    },
  },
} as const;

/**
 * Extended include for getReservationById (with menu, deposits, full extras).
 */
export const RESERVATION_DETAIL_INCLUDE = {
  ...RESERVATION_INCLUDE,
  menuSnapshot: true,
  deposits: true,
  extras: {
    include: { serviceItem: { include: { category: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  categoryExtras: {
    include: {
      packageCategory: {
        include: { category: { select: { id: true, name: true, icon: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;
