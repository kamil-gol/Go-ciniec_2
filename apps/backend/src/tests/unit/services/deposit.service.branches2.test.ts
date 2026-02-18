/**
 * DepositService — Branch Coverage (lines 463-468: sendConfirmationEmail, 488-491: markAsUnpaid)
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    deposit: {
      findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(), update: jest.fn(),
    },
    reservationHistory: { create: jest.fn().mockResolvedValue({}) },
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ id: 'dep-1', count: 0 }]),
  },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: {
    generatePaymentConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  },
}));

jest.mock('../../../services/email.service', () => ({
  __esModule: true,
  default: {
    sendDepositPaidConfirmation: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
    static notFound(entity: string) { return new MockAppError(404, `${entity} not found`); }
    static badRequest(msg: string) { return new MockAppError(400, msg); }
  }
  return { AppError: MockAppError };
});

import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

beforeEach(() => jest.resetAllMocks());

describe('DepositService — sendConfirmationEmail branches (lines 463-468)', () => {

  const makeDeposit = (overrides: any = {}) => ({
    id: 'dep-1',
    amount: { toString: () => '500' },
    paid: true,
    paidAt: null,
    paymentMethod: null,
    reservationId: 'r1',
    reservation: {
      id: 'r1',
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '22:00',
      guests: 50,
      totalPrice: 10000,
      hall: null,
      eventType: null,
      client: { firstName: 'Jan', lastName: 'K', email: 'jan@test.pl', phone: '123' },
    },
    ...overrides,
  });

  it('should handle null paidAt and null paymentMethod (fallback branches)', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit());

    const result = await depositService.sendConfirmationEmail('dep-1');

    expect(result.success).toBe(true);
    const { pdfService } = require('../../../services/pdf.service');
    const pdfCall = pdfService.generatePaymentConfirmationPDF.mock.calls[0][0];
    expect(pdfCall.paymentMethod).toBe('TRANSFER'); // fallback
    expect(pdfCall.paidAt).toBeInstanceOf(Date);
  });

  it('should handle null hall and null eventType', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit());

    const result = await depositService.sendConfirmationEmail('dep-1');
    expect(result.success).toBe(true);

    const emailSvc = require('../../../services/email.service').default;
    const emailCall = emailSvc.sendDepositPaidConfirmation.mock.calls[0][1];
    expect(emailCall.hallName).toBe('Nie przypisano');
    expect(emailCall.eventType).toBe('Wydarzenie');
  });

  it('should use actual paidAt and paymentMethod when provided', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({
      paidAt: '2026-06-10T10:00:00Z',
      paymentMethod: 'BLIK',
      reservation: {
        id: 'r1', date: '2026-06-15', startTime: '14:00', endTime: '22:00',
        guests: 50, totalPrice: 10000,
        hall: { name: 'Sala A' },
        eventType: { name: 'Wesele' },
        client: { firstName: 'Jan', lastName: 'K', email: 'jan@test.pl', phone: '123' },
      },
    }));

    await depositService.sendConfirmationEmail('dep-1');

    const { pdfService } = require('../../../services/pdf.service');
    const pdfCall = pdfService.generatePaymentConfirmationPDF.mock.calls[0][0];
    expect(pdfCall.paymentMethod).toBe('BLIK');
    expect(pdfCall.reservation.hall).toBe('Sala A');
    expect(pdfCall.reservation.eventType).toBe('Wesele');
  });

  it('should throw when deposit is not paid', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: false }));
    await expect(depositService.sendConfirmationEmail('dep-1'))
      .rejects.toThrow('Email potwierdzenia mozna wyslac tylko dla oplaconej zaliczki');
  });

  it('should throw when client has no email', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({
      reservation: {
        id: 'r1', date: '2026-06-15', startTime: '14:00', endTime: '22:00',
        guests: 50, totalPrice: 10000, hall: null, eventType: null,
        client: { firstName: 'Jan', lastName: 'K', email: null, phone: '123' },
      },
    }));
    await expect(depositService.sendConfirmationEmail('dep-1'))
      .rejects.toThrow('Klient nie ma przypisanego adresu email');
  });
});

describe('DepositService — markAsUnpaid branches (lines 488-491)', () => {

  it('should throw when deposit is not paid and status is PENDING', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue({
      id: 'dep-1', paid: false, status: 'PENDING', amount: 500,
    });

    await expect(depositService.markAsUnpaid('dep-1', 'u1'))
      .rejects.toThrow('Ta zaliczka nie jest oznaczona jako oplacona');
  });

  it('should allow marking as unpaid when deposit was PAID', async () => {
    mockPrisma.deposit.findUnique
      .mockResolvedValueOnce({ id: 'dep-1', paid: true, status: 'PAID', amount: 500 })
      .mockResolvedValueOnce({ id: 'dep-1', paid: false, status: 'PENDING', amount: 500, reservation: {} });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await depositService.markAsUnpaid('dep-1', 'u1');
    expect(result).toBeDefined();
  });

  it('should allow marking as unpaid when status is PARTIALLY_PAID', async () => {
    mockPrisma.deposit.findUnique
      .mockResolvedValueOnce({ id: 'dep-1', paid: false, status: 'PARTIALLY_PAID', amount: 500 })
      .mockResolvedValueOnce({ id: 'dep-1', paid: false, status: 'PENDING', amount: 500, reservation: {} });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await depositService.markAsUnpaid('dep-1', 'u1');
    expect(result).toBeDefined();
  });

  it('should throw not found for unknown deposit', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(null);
    await expect(depositService.markAsUnpaid('bad-id', 'u1'))
      .rejects.toThrow('Deposit not found');
  });
});

describe('DepositService — checkAndAutoConfirmReservation', () => {

  it('should auto-confirm when all deposits are PAID and reservation is PENDING', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'PENDING',
      deposits: [
        { id: 'd1', status: 'PAID', amount: 500 },
        { id: 'd2', status: 'PAID', amount: 300 },
      ],
      client: { firstName: 'Jan', lastName: 'K' },
    });
    mockPrisma.reservation.update.mockResolvedValue({});

    await depositService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } })
    );
  });

  it('should NOT auto-confirm when reservation is already CONFIRMED', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'CONFIRMED',
      deposits: [{ id: 'd1', status: 'PAID', amount: 500 }],
      client: null,
    });

    await depositService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
  });

  it('should NOT auto-confirm when no active deposits', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'PENDING',
      deposits: [{ id: 'd1', status: 'CANCELLED', amount: 500 }],
      client: null,
    });

    await depositService.checkAndAutoConfirmReservation('r1', 'u1');

    expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
  });

  it('should catch errors silently', async () => {
    mockPrisma.reservation.findUnique.mockRejectedValue(new Error('DB error'));

    // Should not throw
    await depositService.checkAndAutoConfirmReservation('r1', 'u1');
  });
});
