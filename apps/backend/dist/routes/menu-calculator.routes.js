/**
 * Menu Calculator Routes
 *
 * Express routes for menu price calculation
 * Auth: All endpoints require Staff (ADMIN + EMPLOYEE)
 */
import { Router } from 'express';
import * as menuCalculatorController from '../controllers/menu-calculator.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
const router = Router();
/**
 * @route   POST /api/menu-calculator/calculate
 * @desc    Calculate menu price for given configuration
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/calculate', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
    await menuCalculatorController.calculatePrice(req, res);
}));
/**
 * @route   GET /api/menu-calculator/packages/available
 * @desc    Get available packages for event type and date
 * @query   eventTypeId: string, date?: string
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/packages/available', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
    await menuCalculatorController.getAvailablePackages(req, res);
}));
/**
 * @route   GET /api/menu-calculator/option/:optionId/calculate
 * @desc    Calculate price for a single option
 * @params  optionId: string
 * @query   adults?: number, children?: number, toddlers?: number, quantity?: number
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/option/:optionId/calculate', authMiddleware, requireStaff, validateUUID('optionId'), asyncHandler(async (req, res) => {
    await menuCalculatorController.calculateOptionPrice(req, res);
}));
export default router;
//# sourceMappingURL=menu-calculator.routes.js.map