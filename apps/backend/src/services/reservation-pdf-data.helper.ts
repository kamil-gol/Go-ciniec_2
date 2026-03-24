/**
 * Reservation PDF Data Helper
 * Prepares reservation data for PDF generation.
 * Extracted from reservation.service.ts
 */

import { AppError } from '../utils/AppError';
import { ReservationResponse } from '../types/reservation.types';
import { RESERVATION } from '../i18n/pl';

interface ExtraForPDF {
  customPrice: number | null;
  quantity: number;
  note: string | null;
  status: string;
  serviceItem: { name: string; basePrice: number; priceType: string; category: { name: string } | null };
}

interface CategoryExtraForPDF {
  packageCategory?: { category?: { name: string } | null } | null;
  quantity: number | any;
  pricePerItem: number | any;
  guestCount: number | any;
  portionTarget: string | null;
  totalPrice: number | any;
}

type ReservationWithExtras = ReservationResponse & {
  extras?: ExtraForPDF[];
  deposits?: Array<{ status: string; [key: string]: unknown }>;
  categoryExtras?: CategoryExtraForPDF[];
  internalNotes?: string | null;
};

/**
 * Prepare reservation data for PDF generation.
 * Maps extras -> reservationExtras, categoryExtras for PDF format,
 * strips cancelled deposits and internalNotes.
 */
export function buildPdfData(reservation: ReservationWithExtras) {
  if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

  // Map extras -> reservationExtras for PDF compatibility
  const extras = reservation.extras || [];
  const reservationExtras = extras.map((e) => {
    const unitPrice = e.customPrice !== null && e.customPrice !== undefined
      ? Number(e.customPrice)
      : Number(e.serviceItem.basePrice);
    const quantity = e.quantity || 1;
    let totalPrice: number;

    if (e.serviceItem.priceType === 'PER_PERSON') {
      totalPrice = unitPrice * quantity * (reservation.guests || 0);
    } else if (e.serviceItem.priceType === 'FREE') {
      totalPrice = 0;
    } else {
      // FLAT
      totalPrice = unitPrice * quantity;
    }
    totalPrice = Math.round(totalPrice * 100) / 100;

    return {
      serviceItem: {
        name: e.serviceItem.name,
        priceType: e.serviceItem.priceType,
        category: e.serviceItem.category || null,
      },
      quantity,
      unitPrice,
      totalPrice,
      priceType: e.serviceItem.priceType,
      note: e.note || null,
      status: e.status || 'ACTIVE',
    };
  });

  // #216: Map categoryExtras for PDF rendering
  const categoryExtrasForPDF = (reservation.categoryExtras || []).map((ce) => ({
    categoryName: ce.packageCategory?.category?.name || 'Kategoria',
    quantity: Number(ce.quantity),
    pricePerItem: Number(ce.pricePerItem),
    guestCount: Number(ce.guestCount) || 1,
    portionTarget: ce.portionTarget || 'ALL',
    totalPrice: Number(ce.totalPrice),
  }));

  const pdfData: any = {
    ...reservation,
    reservationExtras,
    categoryExtras: categoryExtrasForPDF,
  };

  // #deposits-fix: Strip CANCELLED deposits — they must NEVER appear in customer-facing PDF
  if (Array.isArray(pdfData.deposits)) {
    pdfData.deposits = pdfData.deposits.filter((d: any) => d.status !== 'CANCELLED');
  }

  // Etap 5: Notatka wewnętrzna NIGDY nie trafia do PDF
  delete pdfData.internalNotes;

  return pdfData;
}
