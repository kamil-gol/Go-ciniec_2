/**
 * Unit tests for deposits/deposit-notifications.service.ts
 * Covers: checkAndAutoConfirmReservation, checkPaidDepositsBeforeCancel, sendConfirmationEmail
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    reservation: { findUnique: jest.fn(), update: jest.fn() },
    reservationHistory: { create: jest.fn() },
    deposit: { findUnique: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../../../../services/pdf.service', () => ({
  pdfService: {
    generatePaymentConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  },
}));

jest.mock('../../../../services/email.service', () => ({
  __esModule: true,
  default: {
    sendDepositPaidConfirmation: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../../../i18n/pl', () => ({
  DEPOSIT: {
    EMAIL_ONLY_PAID: 'Email tylko dla opłaconych',
    CLIENT_NO_EMAIL: 'Klient nie ma emaila',
  },
}));

import { depositNotificationsService } from '../../../../services/deposits/deposit-notifications.service';
import { prisma } from '../../../../lib/prisma';
import emailService from '../../../../services/email.service';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// checkAndAutoConfirmReservation
// ===============================================================

describe('checkAndAutoConfirmReservation', () => {
  it('auto-confirms PENDING reservation when all deposits are PAID', async () => {
    db.reservation.findUnique.mockResolvedValue({
      id: 'r1',
      status: 'PENDING',
      deposits: [
        { status: 'PAID' },
        { status: 'PAID' },
      ],
      client: { id: 'c1' },
    });
    db.reservation.update.mockResolvedValue({});
    db.reservationHistory.create.mockResolvedValue({});

    await depositNotificationsService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(db.reservation.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { status: 'CONFIRMED' },
    });
    expect(db.reservationHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reservationId: 'r1',
        changeType: 'STATUS_CHANGED',
        newValue: 'CONFIRMED',
      }),
    });
  });

  it('does not confirm when reservation is not PENDING', async () => {
    db.reservation.findUnique.mockResolvedValue({
      id: 'r1',
      status: 'CONFIRMED',
      deposits: [{ status: 'PAID' }],
    });

    await depositNotificationsService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(db.reservation.update).not.toHaveBeenCalled();
  });

  it('does not confirm when some deposits are not PAID', async () => {
    db.reservation.findUnique.mockResolvedValue({
      id: 'r1',
      status: 'PENDING',
      deposits: [
        { status: 'PAID' },
        { status: 'PENDING' },
      ],
    });

    await depositNotificationsService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(db.reservation.update).not.toHaveBeenCalled();
  });

  it('does not confirm when no active deposits', async () => {
    db.reservation.findUnique.mockResolvedValue({
      id: 'r1',
      status: 'PENDING',
      deposits: [{ status: 'CANCELLED' }],
    });

    await depositNotificationsService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(db.reservation.update).not.toHaveBeenCalled();
  });

  it('does not throw when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    await expect(
      depositNotificationsService.checkAndAutoConfirmReservation('r-missing', 'u1'),
    ).resolves.not.toThrow();
  });

  it('catches and logs errors', async () => {
    db.reservation.findUnique.mockRejectedValue(new Error('DB fail'));

    await expect(
      depositNotificationsService.checkAndAutoConfirmReservation('r1', 'u1'),
    ).resolves.not.toThrow();
  });
});

// ===============================================================
// checkPaidDepositsBeforeCancel
// ===============================================================

describe('checkPaidDepositsBeforeCancel', () => {
  it('returns paid count and total', async () => {
    db.deposit.findMany.mockResolvedValue([
      { amount: 500 },
      { amount: 300 },
    ]);

    const result = await depositNotificationsService.checkPaidDepositsBeforeCancel('r1');

    expect(result).toEqual({
      hasPaidDeposits: true,
      paidCount: 2,
      paidTotal: 800,
    });
  });

  it('returns false when no paid deposits', async () => {
    db.deposit.findMany.mockResolvedValue([]);

    const result = await depositNotificationsService.checkPaidDepositsBeforeCancel('r1');

    expect(result).toEqual({
      hasPaidDeposits: false,
      paidCount: 0,
      paidTotal: 0,
    });
  });
});

// ===============================================================
// sendConfirmationEmail
// ===============================================================

describe('sendConfirmationEmail', () => {
  const mockDeposit = {
    id: 'd1',
    paid: true,
    paidAt: '2026-03-01',
    amount: 1000,
    paymentMethod: 'CASH',
    reservation: {
      id: 'r1',
      date: '2026-06-01',
      startTime: '14:00',
      endTime: '22:00',
      guests: 100,
      totalPrice: 5000,
      extrasTotalPrice: 500,
      hall: { name: 'Sala Bankietowa' },
      eventType: { name: 'Wesele' },
      client: {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@test.pl',
        phone: '123456789',
      },
    },
  };

  it('sends email with PDF attachment', async () => {
    db.deposit.findUnique.mockResolvedValue(mockDeposit);

    const result = await depositNotificationsService.sendConfirmationEmail('d1');

    expect(result.success).toBe(true);
    expect(emailService.sendDepositPaidConfirmation).toHaveBeenCalledWith(
      'jan@test.pl',
      expect.objectContaining({
        clientName: 'Jan Kowalski',
        depositAmount: '1000.00',
      }),
      expect.any(Buffer),
    );
  });

  it('throws when deposit not found', async () => {
    db.deposit.findUnique.mockResolvedValue(null);

    await expect(depositNotificationsService.sendConfirmationEmail('d-missing')).rejects.toThrow();
  });

  it('throws when deposit is not paid', async () => {
    db.deposit.findUnique.mockResolvedValue({ ...mockDeposit, paid: false });

    await expect(depositNotificationsService.sendConfirmationEmail('d1')).rejects.toThrow();
  });

  it('throws when client has no email', async () => {
    db.deposit.findUnique.mockResolvedValue({
      ...mockDeposit,
      reservation: {
        ...mockDeposit.reservation,
        client: { ...mockDeposit.reservation.client, email: null },
      },
    });

    await expect(depositNotificationsService.sendConfirmationEmail('d1')).rejects.toThrow();
  });
});
