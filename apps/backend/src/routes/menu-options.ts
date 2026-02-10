import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getAllMenuOptions,
  getMenuOptionById,
  createMenuOption,
  updateMenuOption,
  deleteMenuOption,
} from '../controllers/menu-options-controller';

const router = Router();

// Public routes (read-only, for customers browsing menus)
router.get('/', getAllMenuOptions);
router.get('/:id', getMenuOptionById);

// Protected routes (admin/employee only)
router.post('/', authenticate, authorize(['ADMIN', 'EMPLOYEE']), createMenuOption);
router.put('/:id', authenticate, authorize(['ADMIN', 'EMPLOYEE']), updateMenuOption);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteMenuOption);

export default router;
