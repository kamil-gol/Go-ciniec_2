import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { authMiddleware } from '@middlewares/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, firstName, lastName }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * GET /api/auth/password-requirements
 * Get password requirements
 */
router.get('/password-requirements', authController.getPasswordRequirements);

// ═══════════════════════════════════════════
// 🔑 PASSWORD RESET & CHANGE (#124)
// ═══════════════════════════════════════════

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Body: { email }
 * Public — no auth required
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 * Body: { token, newPassword }
 * Public — no auth required
 */
router.post('/reset-password', authController.resetPassword);

/**
 * PATCH /api/auth/change-password
 * Change password for authenticated user
 * Body: { oldPassword, newPassword }
 * Requires: authMiddleware
 */
router.patch('/change-password', authMiddleware, authController.changePassword);

export default router;
