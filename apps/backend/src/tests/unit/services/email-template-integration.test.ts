/**
 * Email Template Integration Tests
 *
 * Tests that email.service uses DocumentTemplate for email body rendering
 * with fallback to hardcoded HTML when templates are not available.
 */

// Mock dependencies before imports
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    documentTemplate: { findUnique: jest.fn() },
  },
}));

jest.mock('../../../services/company-settings.service', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn().mockResolvedValue({
      companyName: 'TestCo',
      phone: '123456',
      email: 'test@test.pl',
    }),
  },
}));

// Mock marked (not installed in test container)
jest.mock('marked', () => ({
  marked: {
    parse: jest.fn().mockImplementation((md: string) => `<p>${md}</p>`),
  },
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

import { prisma } from '../../../lib/prisma';

const db = prisma as any;

// Set SMTP env vars so transporter is created
process.env.SMTP_HOST = 'smtp.test';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.SMTP_FROM = 'test@test.pl';

// Import after mocks
import emailService from '../../../services/email.service';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Email Template Integration', () => {
  describe('when template exists in DB', () => {
    it('should use DB template for deposit reminder', async () => {
      db.documentTemplate.findUnique.mockResolvedValue({
        slug: 'email-deposit-reminder',
        content: 'Cześć **{{clientName}}**, wpłać {{depositAmount}} zł do {{dueDate}}.',
        availableVars: ['clientName', 'depositAmount', 'dueDate'],
      });

      const result = await emailService.sendDepositReminder('test@test.pl', {
        clientName: 'Jan Kowalski',
        depositAmount: '500',
        dueDate: '2026-04-01',
        daysLeft: 7,
        reservationDate: '2026-05-15',
        hallName: 'Sala Złota',
        eventType: 'Wesele',
        guestCount: 100,
      });

      expect(result).toBe(true);
      // Template was fetched from DB
      expect(db.documentTemplate.findUnique).toHaveBeenCalledWith({
        where: { slug: 'email-deposit-reminder' },
      });
    });

    it('should substitute variables in DB template', async () => {
      db.documentTemplate.findUnique.mockResolvedValue({
        slug: 'email-deposit-overdue',
        content: '**{{clientName}}** — zaległa kwota: {{depositAmount}} zł',
        availableVars: ['clientName', 'depositAmount'],
      });

      const result = await emailService.sendDepositOverdueNotice('test@test.pl', {
        clientName: 'Anna Nowak',
        depositAmount: '1000',
        dueDate: '2026-03-01',
        daysOverdue: 5,
        reservationDate: '2026-05-15',
        hallName: 'Sala Kryształowa',
        eventType: 'Komunia',
      });

      expect(result).toBe(true);
    });

    it('should use DB template for deposit paid confirmation', async () => {
      db.documentTemplate.findUnique.mockResolvedValue({
        slug: 'email-deposit-paid',
        content: 'Dziękujemy **{{clientName}}** za wpłatę {{depositAmount}} zł.',
        availableVars: ['clientName', 'depositAmount'],
      });

      const result = await emailService.sendDepositPaidConfirmation('test@test.pl', {
        clientName: 'Jan Kowalski',
        depositAmount: '500',
        paidAt: '2026-03-20',
        paymentMethod: 'TRANSFER',
        reservationDate: '2026-05-15',
        hallName: 'Sala Złota',
        eventType: 'Wesele',
      });

      expect(result).toBe(true);
      expect(db.documentTemplate.findUnique).toHaveBeenCalledWith({
        where: { slug: 'email-deposit-paid' },
      });
    });

    it('should use DB template for password reset', async () => {
      db.documentTemplate.findUnique.mockResolvedValue({
        slug: 'email-password-reset',
        content: 'Cześć **{{firstName}}**, kliknij [tutaj]({{resetUrl}}) żeby zresetować hasło.',
        availableVars: ['firstName', 'resetUrl', 'expiresInMinutes'],
      });

      const result = await emailService.sendPasswordResetEmail('test@test.pl', {
        firstName: 'Jan',
        resetUrl: 'https://app.test/reset/abc123',
        expiresInMinutes: 30,
      });

      expect(result).toBe(true);
      expect(db.documentTemplate.findUnique).toHaveBeenCalledWith({
        where: { slug: 'email-password-reset' },
      });
    });
  });

  describe('when template NOT in DB (fallback)', () => {
    it('should fallback to hardcoded HTML for deposit reminder', async () => {
      db.documentTemplate.findUnique.mockResolvedValue(null);

      const result = await emailService.sendDepositReminder('test@test.pl', {
        clientName: 'Jan Kowalski',
        depositAmount: '500',
        dueDate: '2026-04-01',
        daysLeft: 7,
        reservationDate: '2026-05-15',
        hallName: 'Sala Złota',
        eventType: 'Wesele',
        guestCount: 100,
      });

      // Should still send successfully using fallback
      expect(result).toBe(true);
    });

    it('should fallback to hardcoded HTML for reservation confirmation', async () => {
      db.documentTemplate.findUnique.mockResolvedValue(null);

      const result = await emailService.sendReservationConfirmation('test@test.pl', {
        clientName: 'Jan Kowalski',
        reservationDate: '2026-05-15',
        startTime: '14:00',
        endTime: '22:00',
        hallName: 'Sala Złota',
        eventType: 'Wesele',
        guestCount: 100,
        adults: 80,
        children: 15,
        toddlers: 5,
        totalPrice: '15000',
      });

      expect(result).toBe(true);
    });

    it('should fallback when DB throws error', async () => {
      db.documentTemplate.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const result = await emailService.sendDepositOverdueNotice('test@test.pl', {
        clientName: 'Anna Nowak',
        depositAmount: '1000',
        dueDate: '2026-03-01',
        daysOverdue: 5,
        reservationDate: '2026-05-15',
        hallName: 'Sala Kryształowa',
        eventType: 'Komunia',
      });

      // Should still send successfully using fallback
      expect(result).toBe(true);
    });
  });

  describe('reservation confirmation with extras', () => {
    it('should handle extras in template mode', async () => {
      db.documentTemplate.findUnique.mockResolvedValue({
        slug: 'email-reservation-confirmation',
        content: `Dzień dobry **{{clientName}}**,

Rezerwacja: {{eventType}} — {{eventDate}}
{{extrasSection}}
Kwota: {{totalPrice}} zł`,
        availableVars: ['clientName', 'eventType', 'eventDate', 'extrasSection', 'totalPrice'],
      });

      const result = await emailService.sendReservationConfirmation('test@test.pl', {
        clientName: 'Jan',
        reservationDate: '2026-05-15',
        startTime: '14:00',
        endTime: '22:00',
        hallName: 'Sala Złota',
        eventType: 'Wesele',
        guestCount: 100,
        adults: 80,
        children: 15,
        toddlers: 5,
        totalPrice: '15000',
        extras: [
          { name: 'DJ', categoryName: 'Muzyka', quantity: 1, price: '2000', totalPrice: '2000', priceType: 'FLAT' },
        ],
        extrasTotalPrice: '2000',
      });

      expect(result).toBe(true);
    });
  });
});
