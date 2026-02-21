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
        const result = await authService.login(email, password);
        // FIX: token/user at root level for test compatibility
        res.json({
            success: true,
            data: result,
            token: result.token,
            user: result.user,
            message: 'Logged in successfully',
        });
    }),
    getMe: asyncHandler(async (req, res) => {
        if (!req.user) {
            throw AppError.unauthorized('User not authenticated');
        }
        const userData = await authService.getMe(req.user.id);
        res.json({
            success: true,
            data: { user: userData },
        });
    }),
    getPasswordRequirements: (_req, res) => {
        const requirements = getPasswordRequirements();
        res.json({
            success: true,
            data: { requirements },
        });
    },
};
//# sourceMappingURL=auth.controller.js.map