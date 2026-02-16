/**
 * Auth Controller
 * Updated for RBAC — returns role + permissions on login and /me
 */
import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '@types/index';
import { authService } from '@services/auth.service';
import { AppError } from '@utils/AppError';
import { asyncHandler } from '@middlewares/asyncHandler';
import { getPasswordRequirements } from '@utils/password';

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

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw AppError.badRequest('Email and password are required');
    }

    const result = await authService.login(email, password);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Logged in successfully',
    };

    res.json(response);
  }),

  getMe: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw AppError.unauthorized('User not authenticated');
    }

    const userData = await authService.getMe(req.user.id);

    const response: ApiResponse = {
      success: true,
      data: { user: userData },
    };

    res.json(response);
  }),

  getPasswordRequirements: (_req: any, res: Response) => {
    const requirements = getPasswordRequirements();

    const response: ApiResponse = {
      success: true,
      data: { requirements },
    };

    res.json(response);
  },
};
