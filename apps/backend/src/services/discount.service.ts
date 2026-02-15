/**
 * Discount Service
 * Business logic for reservation discount management
 * Sprint 7: System Rabatów
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';

const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true } },
  createdBy: { select: { id: true, email: true } },
} as const;

export class DiscountService {
  /**
   * Apply or update discount on reservation
   */
  async applyDiscount(
    id: string,
    data: { type: 'PERCENTAGE' | 'FIXED'; value: number; reason: string },
    userId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje');

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });

    if (!reservation) throw new AppError(404, 'Reservation not found');
    if (reservation.status === 'CANCELLED') {
      throw new AppError(400, 'Nie można dodać rabatu do anulowanej rezerwacji');
    }

    if (!['PERCENTAGE', 'FIXED'].includes(data.type)) {
      throw new AppError(400, 'Typ rabatu musi być PERCENTAGE lub FIXED');
    }
    if (!data.value || data.value <= 0) {
      throw new AppError(400, 'Wartość rabatu musi być większa od 0');
    }
    if (!data.reason || data.reason.trim().length < 3) {
      throw new AppError(400, 'Powód rabatu jest wymagany (min. 3 znaki)');
    }

    // Use priceBeforeDiscount if already set (editing existing discount), otherwise current totalPrice
    const basePrice = reservation.priceBeforeDiscount
      ? Number(reservation.priceBeforeDiscount)
      : Number(reservation.totalPrice);

    let discountAmount: number;
    if (data.type === 'PERCENTAGE') {
      if (data.value > 100) throw new AppError(400, 'Rabat procentowy nie może przekroczyć 100%');
      discountAmount = Math.round(basePrice * data.value / 100 * 100) / 100;
    } else {
      discountAmount = data.value;
      if (discountAmount > basePrice) {
        throw new AppError(400, `Rabat kwotowy (${discountAmount} PLN) nie może przekroczyć ceny (${basePrice} PLN)`);
      }
    }

    const newTotalPrice = Math.round((basePrice - discountAmount) * 100) / 100;

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        discountType: data.type,
        discountValue: data.value,
        discountAmount: discountAmount,
        discountReason: data.reason.trim(),
        priceBeforeDiscount: basePrice,
        totalPrice: newTotalPrice,
      },
      include: RESERVATION_INCLUDE,
    });

    // History entry
    const oldDiscount = reservation.discountType
      ? `${reservation.discountType} ${Number(reservation.discountValue)}`
      : 'Brak';

    await prisma.reservationHistory.create({
      data: {
        reservationId: id,
        changedByUserId: userId,
        changeType: 'DISCOUNT_APPLIED',
        fieldName: 'discount',
        oldValue: oldDiscount,
        newValue: `${data.type} ${data.value}${data.type === 'PERCENTAGE' ? '%' : ' PLN'} = -${discountAmount} PLN`,
        reason: `Rabat: ${data.reason}`,
      },
    });

    return updated;
  }

  /**
   * Remove discount from reservation
   */
  async removeDiscount(id: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje');

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });

    if (!reservation) throw new AppError(404, 'Reservation not found');
    if (!reservation.discountType) {
      throw new AppError(400, 'Ta rezerwacja nie ma rabatu');
    }

    const originalPrice = Number(reservation.priceBeforeDiscount) || Number(reservation.totalPrice);

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        discountType: null,
        discountValue: null,
        discountAmount: null,
        discountReason: null,
        priceBeforeDiscount: null,
        totalPrice: originalPrice,
      },
      include: RESERVATION_INCLUDE,
    });

    await prisma.reservationHistory.create({
      data: {
        reservationId: id,
        changedByUserId: userId,
        changeType: 'DISCOUNT_REMOVED',
        fieldName: 'discount',
        oldValue: `${reservation.discountType} ${Number(reservation.discountValue)}`,
        newValue: 'Brak',
        reason: `Rabat usunięty. Przywrócono cenę: ${originalPrice} PLN`,
      },
    });

    return updated;
  }
}

export default new DiscountService();
