/**
 * EmailService — Unit Tests
 */

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-001' });
const mockVerify = jest.fn().mockResolvedValue(true);

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify,
    }),
  },
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.test.pl',
      SMTP_PORT: '587',
      SMTP_USER: 'user@test.pl',
      SMTP_PASS: 'password123',
      SMTP_FROM: 'Gościniec <noreply@test.pl>',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should send email when SMTP is configured', async () => {
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.send({
      to: 'jan@test.pl', subject: 'Test', html: '<p>Hello</p>',
    });
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jan@test.pl', subject: 'Test' })
    );
  });

  it('should return false on send error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.send({
      to: 'jan@test.pl', subject: 'Test', html: '<p>Hello</p>',
    });
    expect(result).toBe(false);
  });

  it('should dry-run when SMTP not configured', async () => {
    process.env.SMTP_HOST = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.send({
      to: 'jan@test.pl', subject: 'Test', html: '<p>Hello</p>',
    });
    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send deposit reminder email', async () => {
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.sendDepositReminder('jan@test.pl', {
      clientName: 'Jan Kowalski', depositAmount: '5 000',
      dueDate: '25 lutego 2026', daysLeft: 7,
      reservationDate: '15 marca 2026', hallName: 'Sala Główna',
      eventType: 'Wesele', guestCount: 80,
    });
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jan@test.pl' })
    );
  });

  it('should send overdue notice email', async () => {
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.sendDepositOverdueNotice('jan@test.pl', {
      clientName: 'Jan Kowalski', depositAmount: '5 000',
      dueDate: '10 lutego 2026', daysOverdue: 8,
      reservationDate: '15 marca 2026', hallName: 'Sala Główna',
      eventType: 'Wesele',
    });
    expect(result).toBe(true);
  });

  it('should verify SMTP connection', async () => {
    const { default: emailService } = await import('../../../services/email.service');
    const result = await emailService.verify();
    expect(result).toBe(true);
  });
});
