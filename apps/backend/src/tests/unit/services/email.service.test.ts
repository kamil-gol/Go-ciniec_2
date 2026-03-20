/**
 * Email Service — Comprehensive Unit Tests
 * Targets 44.82% branches. Covers: SMTP configured/not,
 * attachments, SMTP_FROM fallbacks, send errors, verify, templates.
 *
 * Strategy: The module reads process.env at runtime in send()/getTransporter(),
 * so we mock env vars directly and reset the cached transporter between tests
 * by re-requiring the module.
 *
 * Note: After jest.resetModules() + require(), dotenv may re-load .env file
 * through module dependency chain. We force-clear SMTP vars after loadService()
 * to guarantee test isolation on environments with real .env files.
 */

const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransport = jest.fn((..._: any[]) => ({ sendMail: mockSendMail, verify: mockVerify }));

jest.mock('nodemailer', () => ({
  createTransport: (...args: any[]) => mockCreateTransport(...args),
}));

jest.mock('marked', () => ({
  marked: { parse: jest.fn().mockResolvedValue('<p>mocked</p>') },
}), { virtual: true });

jest.mock('../../../services/document-template.service', () => ({
  __esModule: true,
  default: { preview: jest.fn().mockRejectedValue(new Error('no template')) },
}));

jest.mock('@utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(),
  },
}));

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

/** Clear all SMTP env vars (guards against dotenv re-load in module require chain) */
function clearSmtpEnv() {
  SMTP_KEYS.forEach(k => delete process.env[k]);
}

function loadService(env: Record<string, string> = {}) {
  jest.resetModules();
  jest.mock('nodemailer', () => ({
    createTransport: (...args: any[]) => mockCreateTransport(...args),
  }));
  jest.mock('marked', () => ({
    marked: { parse: jest.fn().mockResolvedValue('<p>mocked</p>') },
  }), { virtual: true });
  jest.mock('../../../services/document-template.service', () => ({
    __esModule: true,
    default: { preview: jest.fn().mockRejectedValue(new Error('no template')) },
  }));
  jest.mock('@utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }));

  // Save and override env
  const saved: Record<string, string | undefined> = {};
  for (const key of SMTP_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }

  const mod = require('../../../services/email.service');

  // After require(), dotenv may have re-loaded .env (via module dependency chain).
  // Re-apply the intended env state to guarantee isolation.
  clearSmtpEnv();
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }

  return { svc: mod.default, restore: () => {
    for (const key of SMTP_KEYS) {
      if (saved[key] !== undefined) process.env[key] = saved[key];
      else delete process.env[key];
    }
  }};
}

let restoreFn: (() => void) | null = null;

afterEach(() => {
  if (restoreFn) { restoreFn(); restoreFn = null; }
  jest.clearAllMocks();
});

describe('emailService', () => {
  // ========== send() — no SMTP ==========
  describe('send() without SMTP configured', () => {
    it('should return false and log dry-run', async () => {
      const { svc, restore } = loadService({});
      restoreFn = restore;
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(false);
    });

    it('should log attachments in dry-run', async () => {
      const { svc, restore } = loadService({});
      restoreFn = restore;
      const result = await svc.send({
        to: 'a@b.com', subject: 'Test', html: '<p>hi</p>',
        attachments: [{ filename: 'file.pdf', content: Buffer.from('pdf') }],
      });
      expect(result).toBe(false);
    });
  });

  // ========== send() — SMTP configured ==========
  describe('send() with SMTP configured', () => {
    it('should send email and return true', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass', SMTP_FROM: 'noreply@test.pl',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'noreply@test.pl', to: 'a@b.com' })
      );
    });

    it('should use SMTP_USER as from fallback when SMTP_FROM not set', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user@test.pl', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      // loadService already re-applies env after require(), but double-guard here
      delete process.env.SMTP_FROM;
      mockSendMail.mockResolvedValue({ messageId: 'msg-2' });
      await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'user@test.pl' })
      );
    });

    it('should include attachments when provided', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-3' });
      const att = [{ filename: 'doc.pdf', content: Buffer.from('data'), contentType: 'application/pdf' }];
      await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>', attachments: att });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ attachments: att })
      );
    });

    it('should return false on sendMail error', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockRejectedValue(new Error('SMTP failed'));
      const result = await svc.send({ to: 'a@b.com', subject: 'Test', html: '<p>hi</p>' });
      expect(result).toBe(false);
    });
  });

  // ========== sendDepositReminder ==========
  describe('sendDepositReminder()', () => {
    it('should call send with correct subject and HTML', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
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
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
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
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-p' });
      const pdf = Buffer.from('pdf-data');
      const result = await svc.sendDepositPaidConfirmation('client@test.pl', DATA, pdf);
      expect(result).toBe(true);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments).toHaveLength(1);
      expect(call.attachments[0].filename).toBe('Potwierdzenie_wplaty.pdf');
      expect(call.html).toContain('załączniku PDF');
    });

    it('should send without attachment when no pdfBuffer', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-p2' });
      await svc.sendDepositPaidConfirmation('client@test.pl', DATA);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments).toBeUndefined();
    });

    it('should use methodLabels fallback for unknown method', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-p3' });
      await svc.sendDepositPaidConfirmation('client@test.pl', { ...DATA, paymentMethod: 'CRYPTO' });
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('CRYPTO');
    });

    it('should use known methodLabel CASH', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockSendMail.mockResolvedValue({ messageId: 'msg-p4' });
      await svc.sendDepositPaidConfirmation('client@test.pl', { ...DATA, paymentMethod: 'CASH' });
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('Gotówka');
    });
  });

  // ========== verify ==========
  describe('verify()', () => {
    it('should return false when not configured', async () => {
      const { svc, restore } = loadService({});
      restoreFn = restore;
      // loadService() already clears + re-applies env after require(),
      // but force-clear one more time to guarantee transporter stays null
      clearSmtpEnv();
      expect(await svc.verify()).toBe(false);
    });

    it('should return true on successful verify', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockVerify.mockResolvedValue(true);
      expect(await svc.verify()).toBe(true);
    });

    it('should return false on verify error', async () => {
      const { svc, restore } = loadService({
        SMTP_HOST: 'smtp.test', SMTP_USER: 'user', SMTP_PASS: 'pass',
      });
      restoreFn = restore;
      mockVerify.mockRejectedValue(new Error('SMTP down'));
      expect(await svc.verify()).toBe(false);
    });
  });
});
