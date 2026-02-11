/**
 * Menu Calculator Routes
 * 
 * Express routes for menu price calculation
 */

import { Router } from 'express';
import * as menuCalculatorController from '../controllers/menu-calculator.controller';

const router = Router();

// POST /api/menu-calculator/calculate
router.post('/calculate', menuCalculatorController.calculatePrice);

// GET /api/menu-calculator/packages/available?eventTypeId=...&date=...
router.get('/packages/available', menuCalculatorController.getAvailablePackages);

// GET /api/menu-calculator/option/:optionId/calculate?adults=...&children=...&toddlers=...&quantity=...
router.get('/option/:optionId/calculate', menuCalculatorController.calculateOptionPrice);

export default router;
