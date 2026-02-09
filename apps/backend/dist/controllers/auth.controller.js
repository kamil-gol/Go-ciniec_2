import { authService } from '@services/auth.service';
import { AppError, asyncHandler } from '@middlewares/errorHandler';
import { getPasswordRequirements } from '@utils/password';
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
        const result = await authService.register({
            email,
            password,
            firstName,
            lastName,
        });
        const response = {
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
        const response = {
            success: true,
            data: result,
            message: 'Logged in successfully',
        };
        res.json(response);
    }),
    /**
     * GET /api/auth/me
     */
    getMe: asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new AppError(401, 'User not authenticated');
        }
        const response = {
            success: true,
            data: { user: req.user },
        };
        res.json(response);
    }),
    /**
     * GET /api/auth/password-requirements
     */
    getPasswordRequirements: (_req, res) => {
        const requirements = getPasswordRequirements();
        const response = {
            success: true,
            data: { requirements },
        };
        res.json(response);
    },
};
//# sourceMappingURL=auth.controller.js.map