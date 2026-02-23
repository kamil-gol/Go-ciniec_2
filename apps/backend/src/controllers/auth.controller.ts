/**
 * Auth Controller
 * Updated for RBAC — returns role + permissions on login and /me
 * Password reset & change handlers added for #124
 * 🔄 #145: Refresh token rotation + logout endpoint
 * FIX: token/user also at root level for backward compatibility with tests
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import authService from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validatePassword } from '../utils/password';
import { PASSWORD_RESET, REFRESH_TOKEN } from '../i18n/pl';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw AppError.badRequest('Missing required fields: email, password, firstName, lastName');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest('Invalid email format');
    }

    if (firstName.length < 2 || lastName.length < 2) {
      throw AppError.badRequest('First and last name must be at least 2 characters');
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    // FIX: token/user at root level for test compatibility
    res.status(201).json({
      success: true,
      data: result,
      token: result.token,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      message: 'User registered successfully',
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw AppError.badRequest('Email and password are required');
    }

    const result = await authService.login({ email, password });

    // FIX: token/user at root level for test compatibility
    res.json({
      success: true,
      data: result,
      token: result.token,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      message: 'Logged in successfully',
    });
  }),

  /**
   * POST /api/auth/refresh
   * Body: { refreshToken }
   * Public — no auth required (access token may be expired)
   */
  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw AppError.badRequest(REFRESH_TOKEN.MISSING);
    }

    const result = await authService.refresh(refreshToken);

    res.json({
      success: true,
      data: result,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }),

  /**
   * POST /api/auth/logout
   * Body: { refreshToken }
   * Public — no auth required
   */
  logout: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Wylogowano pomyślnie',
    });
  }),

  getMe: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw AppError.unauthorized('User not authenticated');
    }

    const userData = await authService.getMe(req.user.id);

    res.json({
      success: true,
      data: { user: userData },
    });
  }),

  getPasswordRequirements: (_req: any, res: Response) => {
    const { requirements } = validatePassword('');

    res.json({
      success: true,
      data: { requirements },
    });
  },

  // ═══════════════════════════════════════════
  // 🔑 PASSWORD RESET & CHANGE (#124)
  // ═══════════════════════════════════════════

  /**
   * POST /api/auth/forgot-password
   * Body: { email }
   * Always returns 200 (anti-enumeration)
   */
  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw AppError.badRequest('Adres email jest wymagany');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    await authService.forgotPassword(email);

    // Always success — never reveal if email exists
    res.json({
      success: true,
      message: PASSWORD_RESET.EMAIL_SENT,
    });
  }),

  /**
   * POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  resetPassword: asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw AppError.badRequest('Token i nowe hasło są wymagane');
    }

    await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: PASSWORD_RESET.PASSWORD_CHANGED,
    });
  }),

  /**
   * PATCH /api/auth/change-password
   * Body: { oldPassword, newPassword }
   * Requires: authMiddleware
   */
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw AppError.unauthorized('User not authenticated');
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw AppError.badRequest('Aktualne hasło i nowe hasło są wymagane');
    }

    await authService.changePassword(req.user.id, oldPassword, newPassword);

    res.json({
      success: true,
      message: PASSWORD_RESET.PASSWORD_CHANGED,
    });
  }),
};
