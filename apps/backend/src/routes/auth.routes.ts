import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { authMiddleware } from '@middlewares/auth';
import { validateBody } from '@middlewares/validateBody';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@/validation/auth.validation';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { email, password, firstName, lastName }
 */
router.post('/register', validateBody(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);

/**
 * POST /api/auth/logout
 * Body: { refreshToken }
 */
router.post('/logout', validateBody(logoutSchema), authController.logout);

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * GET /api/auth/password-requirements
 */
router.get('/password-requirements', authController.getPasswordRequirements);

// ═══════════════════════════════════════════
// PASSWORD RESET & CHANGE (#124)
// ═══════════════════════════════════════════

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

/**
 * PATCH /api/auth/change-password
 * Body: { oldPassword, newPassword }
 */
router.patch('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);

export default router;
