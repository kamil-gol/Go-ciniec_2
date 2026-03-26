/**
 * PasswordResetService — Unit Tests
 * Covers: forgotPassword, resetPassword, changePassword
 * Anti-enumeration, token lifecycle, password validation, same-password reuse
 */

import bcrypt from 'bcryptjs';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
  changeLog: {
    create: jest.fn(),
  },
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

const mockSendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../services/email.service', () => ({
  __esModule: true,
  default: { sendPasswordResetEmail: mockSendPasswordResetEmail },
}));

jest.mock('marked', () => ({
  marked: { parse: jest.fn().mockResolvedValue('<p>mocked</p>') },
}), { virtual: true });

jest.mock('../../../services/document-template.service', () => ({
  __esModule: true,
  default: { preview: jest.fn().mockRejectedValue(new Error('no template')) },
}));

const mockRevokeAllUserTokens = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../services/auth/token.service', () => ({
  tokenService: { revokeAllUserTokens: mockRevokeAllUserTokens },
}));

jest.mock('../../../utils/password', () => ({
  validatePassword: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('a'.repeat(64)),
  }),
}));

import { passwordResetService } from '../../../services/auth/password-reset.service';
import { validatePassword } from '../../../utils/password';
import { PASSWORD_RESET } from '../../../i18n/pl';

// ── Fixtures ───────────────────────────────────────────────────────────

const hashedPassword = bcrypt.hashSync('OldPass1!', 10);

const activeUser = {
  id: 'user-1',
  email: 'jan@test.pl',
  firstName: 'Jan',
  lastName: 'Kowalski',
  isActive: true,
  password: hashedPassword,
};

const inactiveUser = {
  ...activeUser,
  id: 'user-2',
  email: 'inactive@test.pl',
  isActive: false,
};

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (validatePassword as jest.Mock).mockReturnValue({ valid: true, errors: [] });
});

describe('PasswordResetService', () => {
  // ========== forgotPassword ==========
  describe('forgotPassword()', () => {
    it('powinno wygenerować token i wysłać email dla aktywnego użytkownika', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({});

      await passwordResetService.forgotPassword('Jan@test.pl');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'jan@test.pl' },
      });
      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: 'a'.repeat(64),
            userId: 'user-1',
          }),
        }),
      );
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'jan@test.pl',
        expect.objectContaining({
          firstName: 'Jan',
          expiresInMinutes: 60,
        }),
      );
    });

    it('powinno cicho zwrócić void dla nieistniejącego emaila (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await passwordResetService.forgotPassword('nieznany@test.pl');

      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('powinno cicho zwrócić void dla nieaktywnego użytkownika (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      await passwordResetService.forgotPassword('inactive@test.pl');

      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('powinno unieważnić istniejące niewykorzystane tokeny użytkownika', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({});

      await passwordResetService.forgotPassword('jan@test.pl');

      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('powinno nie rzucić błędu gdy wysyłka emaila się nie powiedzie', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({});
      mockSendPasswordResetEmail.mockRejectedValueOnce(new Error('SMTP down'));

      // Should not throw — fire-and-forget
      await expect(passwordResetService.forgotPassword('jan@test.pl')).resolves.toBeUndefined();
    });
  });

  // ========== resetPassword ==========
  describe('resetPassword()', () => {
    const validToken = {
      id: 'token-1',
      token: 'valid-token',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: activeUser,
    };

    it('powinno zresetować hasło z prawidłowym tokenem', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      mockPrisma.$transaction.mockResolvedValue(undefined);

      await passwordResetService.resetPassword('valid-token', 'NewPass123!');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockRevokeAllUserTokens).toHaveBeenCalledWith('user-1');
    });

    it('powinno rzucić błąd dla nieistniejącego tokenu', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        passwordResetService.resetPassword('bad-token', 'NewPass123!'),
      ).rejects.toThrow(PASSWORD_RESET.TOKEN_INVALID);
    });

    it('powinno rzucić błąd dla już użytego tokenu', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validToken,
        usedAt: new Date(),
      });

      await expect(
        passwordResetService.resetPassword('used-token', 'NewPass123!'),
      ).rejects.toThrow(PASSWORD_RESET.TOKEN_USED);
    });

    it('powinno rzucić błąd dla wygasłego tokenu', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        passwordResetService.resetPassword('expired-token', 'NewPass123!'),
      ).rejects.toThrow(PASSWORD_RESET.TOKEN_EXPIRED);
    });

    it('powinno rzucić błąd gdy walidacja hasła nie przejdzie', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      (validatePassword as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Za krótkie hasło', 'Brak cyfry'],
      });

      await expect(
        passwordResetService.resetPassword('valid-token', 'weak'),
      ).rejects.toThrow('Za krótkie hasło. Brak cyfry');
    });
  });

  // ========== changePassword ==========
  describe('changePassword()', () => {
    it('powinno zmienić hasło z prawidłowym starym hasłem', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);
      mockPrisma.user.update.mockResolvedValue({});

      await passwordResetService.changePassword('user-1', 'OldPass1!', 'NewPass99!');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: expect.any(String) },
      });
      expect(mockRevokeAllUserTokens).toHaveBeenCalledWith('user-1');
    });

    it('powinno rzucić błąd gdy użytkownik nie istnieje', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        passwordResetService.changePassword('no-user', 'old', 'new'),
      ).rejects.toThrow(/Użytkownik/);
    });

    it('powinno rzucić błąd gdy stare hasło jest nieprawidłowe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      await expect(
        passwordResetService.changePassword('user-1', 'WrongOld!', 'NewPass99!'),
      ).rejects.toThrow(PASSWORD_RESET.OLD_PASSWORD_WRONG);
    });

    it('powinno rzucić błąd gdy nowe hasło jest takie samo jak stare', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      await expect(
        passwordResetService.changePassword('user-1', 'OldPass1!', 'OldPass1!'),
      ).rejects.toThrow(PASSWORD_RESET.SAME_PASSWORD);
    });

    it('powinno rzucić błąd gdy walidacja nowego hasła nie przejdzie', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);
      (validatePassword as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Hasło za krótkie'],
      });

      await expect(
        passwordResetService.changePassword('user-1', 'OldPass1!', 'ab'),
      ).rejects.toThrow('Hasło za krótkie');
    });
  });
});
