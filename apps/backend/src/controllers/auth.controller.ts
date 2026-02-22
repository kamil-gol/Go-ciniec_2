/**
 * Auth Controller
 * Updated for RBAC — returns role + permissions on login and /me
 * Added: forgotPassword, resetPassword, changePassword
 * FIX: token/user also at root level for backward compatibility with tests
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import authService from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validatePassword } from '../utils/password';

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
      user: result.user,
      message: 'Logged in successfully',
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

  // ═══════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw AppError.badRequest('Adres email jest wymagany');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      message: result.message,
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      throw AppError.badRequest('Token i nowe hasło są wymagane');
    }

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message,
    });
  }),

  changePassword: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw AppError.unauthorized('User not authenticated');
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw AppError.badRequest('Obecne hasło i nowe hasło są wymagane');
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);

    res.json({
      success: true,
      message: result.message,
    });
  }),
};
