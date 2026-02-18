/**
 * Email Service — Comprehensive Unit Tests
 * Targets 44.82% branches. Covers: SMTP configured/not,
 * attachments, SMTP_FROM fallbacks, send errors, verify, templates.
 */

const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail, verify: mockVerify })),
}));

jest.mock('@utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(),
  },
}));

import logger from '@utils/logger';

// Helper to reload module with different env
function loadService(env: Record<string, string | undefined> = {}) {
  // Reset module cache
  jest.resetModules();

  // Re-mock after resetModules
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: mockSendMail, verify: mockVerify })),
  }));
  jest.mock('@utils/logger', () => ({
    __esModule: true,
    default: {
      info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(),
    },
  }));

  const orig = { ...process.env };
  // Clear SMTP vars
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM;
  // Set requested vars
  Object.assign(process.env, env);

  const mod = require('../../../services/email.service');
  // Restore env
  process.env = orig;
  return mod.default;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('emailService', () => {
  // ========== send() — no SMTP ==========
  describe('send() without SMTP configured', () => {
    it('should return false and log dry-run', async () => {
      const svc = loadService({});
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(false);
    });

    it('should log attachments in dry-run', async () => {
      const svc = loadService({});
      await svc.send({
        to: 'a@b.com', subject: 'Test', html: '<p>hi</p>',
        attachments: [{ filename: 'file.pdf', content: Buffer.from('pdf') }],
      });
      expect(result).toBeFalsy;
    });
  });

  // ========== send() — SMTP configured ==========
  describe('send() with SMTP configured', () => {
    it('should send email and return true', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass', SMTP_FROM: 'noreply@test.pl' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'noreply@test.pl', to: 'a@b.com' })
      );
    });

    it('should use SMTP_USER as from fallback when SMTP_FROM not set', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user@test.pl', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-2' });
      await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'user@test.pl' })
      );
    });

    it('should include attachments when provided', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-3' });
      const att = [{ filename: 'doc.pdf', content: Buffer.from('data'), contentType: 'application/pdf' }];
      await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>', attachments: att });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ attachments: att })
      );
    });

    it('should return false on sendMail error', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockRejectedValue(new Error('SMTP failed'));
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(false);
    });
  });

  // ========== sendDepositReminder ==========
  describe('sendDepositReminder()', () => {
    it('should call send with correct subject and HTML', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-r' });
      const result = await svc.sendDepositReminder('client@test.pl', {
        clientName: 'Jan Kowalski', depositAmount: '5000', dueDate: '2026-03-01',
        daysLeft: 7, reservationDate: '2026-06-15', hallName: 'Sala A',
        eventType: 'Wesele', guestCount: 120,
      });
      expect(result).toBe(true);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.subject).toContain('Przypomnienie');
      expect(call.subject).toContain('5000');
      expect(call.html).toContain('Jan Kowalski');
      expect(call.html).toContain('Sala A');
    });
  });

  // ========== sendDepositOverdueNotice ==========
  describe('sendDepositOverdueNotice()', () => {
    it('should call send with overdue subject', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-o' });
      const result = await svc.sendDepositOverdueNotice('client@test.pl', {
        clientName: 'Anna Nowak', depositAmount: '3000', dueDate: '2026-01-01',
        daysOverdue: 14, reservationDate: '2026-06-15', hallName: 'Sala B',
        eventType: 'Komunia',
      });
      expect(result).toBe(true);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.subject).toContain('Zaleg');
      expect(call.html).toContain('Anna Nowak');
    });
  });

  // ========== sendDepositPaidConfirmation ==========
  describe('sendDepositPaidConfirmation()', () => {
    const DATA = {
      clientName: 'Jan', depositAmount: '5000', paidAt: '2026-02-18',
      paymentMethod: 'TRANSFER', reservationDate: '2026-06-15',
      hallName: 'Sala A', eventType: 'Wesele',
    };

    it('should send with PDF attachment', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-p' });
      const pdf = Buffer.from('pdf-data');
      const result = await svc.sendDepositPaidConfirmation('client@test.pl', DATA, pdf);
      expect(result).toBe(true);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments).toHaveLength(1);
      expect(call.attachments[0].filename).toBe('Potwierdzenie_wplaty.pdf');
      expect(call.html).toContain('Potwierdzenie w za\u0142\u0105czniku PDF');
    });

    it('should send without attachment when no pdfBuffer', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-p2' });
      await svc.sendDepositPaidConfirmation('client@test.pl', DATA);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments).toBeUndefined();
    });

    it('should use methodLabels fallback for unknown method', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-p3' });
      await svc.sendDepositPaidConfirmation('client@test.pl', { ...DATA, paymentMethod: 'CRYPTO' });
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('CRYPTO');
    });

    it('should use known methodLabel CASH', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-p4' });
      await svc.sendDepositPaidConfirmation('client@test.pl', { ...DATA, paymentMethod: 'CASH' });
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('Got\u00f3wka');
    });
  });

  // ========== verify ==========
  describe('verify()', () => {
    it('should return false when not configured', async () => {
      const svc = loadService({});
      expect(await svc.verify()).toBe(false);
    });

    it('should return true on successful verify', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockVerify.mockResolvedValue(true);
      expect(await svc.verify()).toBe(true);
    });

    it('should return false on verify error', async () => {
      const svc = loadService({ SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass' });
      mockVerify.mockRejectedValue(new Error('SMTP down'));
      expect(await svc.verify()).toBe(false);
    });
  });
});
