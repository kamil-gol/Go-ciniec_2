import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '@types/index';
import { AuthService } from '@services/auth.service';
import { AppError, asyncHandler } from '@middlewares/errorHandler';
import { getPasswordRequirements } from '@utils/password';
import logger from '@utils/logger';

const authService = new AuthService();

export const authController = {
  /**
   * POST /api/auth/register
   */
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      throw new AppError(400, 'Missing required fields: email, password, firstName, lastName');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Invalid email format');
    }

    if (firstName.length < 2 || lastName.length < 2) {
      throw new AppError(400, 'First and last name must be at least 2 characters');
    }

    const result = await authService.register(email, password, firstName, lastName);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  }),

  /**
   * POST /api/auth/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const result = await authService.login(email, password);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Logged in successfully',
    };

    res.json(response);
  }),

  /**
   * GET /api/auth/me
   */
  getMe: asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const user = await authService.getUserById(req.user.id);

    const response: ApiResponse = {
      success: true,
      data: { user },
    };

    res.json(response);
  }),

  /**
   * GET /api/auth/password-requirements
   */
  getPasswordRequirements: (_req, res: Response) => {
    const requirements = getPasswordRequirements();

    const response: ApiResponse = {
      success: true,
      data: { requirements },
    };

    res.json(response);
  },
};
