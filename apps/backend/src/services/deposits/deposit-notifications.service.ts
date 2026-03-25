/**
 * Deposit Notifications Service
 * Auto-confirm logic + email confirmation after payment
 * Extracted from deposit.service.ts
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { Deposit } from '@/prisma-client';
import { pdfService } from '../pdf.service';
import emailService from '../email.service';
import logger from '../../utils/logger';
import { DEPOSIT } from '../../i18n/pl';
import { DEPOSIT_INCLUDE, getFullReservationPrice } from './deposit.helpers';

export const depositNotificationsService = {
  /**
   * Phase 4.2: Check if all active deposits for a reservation are paid.
   * If yes and reservation is PENDING -> auto-confirm it.
   */
  async checkAndAutoConfirmReservation(reservationId: string, userId: string) {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { deposits: true, client: true },
      });

      if (!reservation) return;
      // Only auto-confirm PENDING reservations
      if (reservation.status !== 'PENDING') return;

      const activeDeposits = reservation.deposits.filter(
        (d: Deposit) => d.status !== 'CANCELLED'
      );

      // Need at least one active deposit
      if (activeDeposits.length === 0) return;

      const allPaid = activeDeposits.every((d: Deposit) => d.status === 'PAID');

      if (allPaid) {
        await prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED' },
        });

        // Create reservation history entry
        await prisma.reservationHistory.create({
          data: {
            reservationId,
            changedByUserId: userId,
            changeType: 'STATUS_CHANGED',
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CONFIRMED',
            reason: 'Automatyczne potwierdzenie \u2014 wszystkie zaliczki op\u0142acone',
          },
        });

        // #217: logChange removed — reservationHistory entry above already covers AUTO_CONFIRM

        logger.info(`[Deposit] Auto-confirmed reservation ${reservationId} \u2014 all ${activeDeposits.length} deposits paid`);
      }
    } catch (error) {
      // Don't fail the payment operation if auto-confirm fails
      logger.error(`[Deposit] Error in auto-confirm check for reservation ${reservationId}:`, error);
    }
  },

  /**
   * Phase 4.3: Check if a reservation has paid deposits (used before cancel/delete).
   * Returns info about paid deposits for the guard check.
   */
  async checkPaidDepositsBeforeCancel(reservationId: string): Promise<{ hasPaidDeposits: boolean; paidCount: number; paidTotal: number }> {
    const deposits = await prisma.deposit.findMany({
      where: { reservationId, status: 'PAID' },
    });

    const paidCount = deposits.length;
    const paidTotal = deposits.reduce((sum: number, d: Deposit) => sum + Number(d.amount), 0);

    return { hasPaidDeposits: paidCount > 0, paidCount, paidTotal };
  },

  async sendConfirmationEmail(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    if (!deposit) throw AppError.notFound('Zaliczka');
    if (!deposit.paid) throw AppError.badRequest(DEPOSIT.EMAIL_ONLY_PAID);

    const reservation = deposit.reservation;
    const client = reservation?.client;

    if (!client?.email) throw AppError.badRequest(DEPOSIT.CLIENT_NO_EMAIL);

    const pdfBuffer = await pdfService.generatePaymentConfirmationPDF({
      depositId: deposit.id,
      amount: Number(deposit.amount),
      paidAt: deposit.paidAt ? new Date(deposit.paidAt) : new Date(),
      paymentMethod: deposit.paymentMethod || 'TRANSFER',
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || undefined,
        phone: client.phone,
      },
      reservation: {
        id: reservation.id,
        date: reservation.date || '',
        startTime: reservation.startTime || '',
        endTime: reservation.endTime || '',
        hall: reservation.hall?.name,
        eventType: reservation.eventType?.name,
        guests: reservation.guests,
        totalPrice: getFullReservationPrice(reservation),
      },
    });

    await emailService.sendDepositPaidConfirmation(
      client.email,
      {
        clientName: `${client.firstName} ${client.lastName}`,
        depositAmount: Number(deposit.amount).toFixed(2),
        paidAt: (deposit.paidAt ? new Date(deposit.paidAt) : new Date()).toLocaleDateString('pl-PL', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        paymentMethod: deposit.paymentMethod || 'TRANSFER',
        reservationDate: reservation.date || '',
        hallName: reservation.hall?.name || 'Nie przypisano',
        eventType: reservation.eventType?.name || 'Wydarzenie',
      },
      pdfBuffer
    );

    logger.info(`[Deposit] Email confirmation sent to ${client.email} for deposit ${id}`);

    return { success: true, message: `Email wys\u0142any do ${client.email}` };
  },
};
