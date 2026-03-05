import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { validateUUID } from '../middlewares/validateUUID';
import { validateBody } from '../middlewares/validateBody';
import {
  createOrderSchema,
  updateOrderSchema,
  changeStatusSchema,
  createDepositSchema,
  updateDepositSchema,
  markDepositPaidSchema,
} from '../validation/catering-order.validation';
import * as ctrl from '../controllers/catering-order.controller';

const router = Router();

// GET /api/catering/orders
router.get(
  '/',
  authenticate,
  requirePermission('catering:read'),
  ctrl.listOrders,
);

// GET /api/catering/orders/:id
router.get(
  '/:id',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  ctrl.getOrder,
);

// POST /api/catering/orders
router.post(
  '/',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateBody(createOrderSchema),
  ctrl.createOrder,
);

// PATCH /api/catering/orders/:id
router.patch(
  '/:id',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(updateOrderSchema),
  ctrl.updateOrder,
);

// PATCH /api/catering/orders/:id/status
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(changeStatusSchema),
  ctrl.changeStatus,
);

// DELETE /api/catering/orders/:id  (tylko DRAFT/CANCELLED)
router.delete(
  '/:id',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  ctrl.deleteOrder,
);

// GET /api/catering/orders/:id/history
router.get(
  '/:id/history',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  ctrl.getHistory,
);

// POST /api/catering/orders/:id/deposits
router.post(
  '/:id/deposits',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(createDepositSchema),
  ctrl.createDeposit,
);

// PATCH /api/catering/orders/:id/deposits/:depositId
router.patch(
  '/:id/deposits/:depositId',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateUUID('depositId'),
  validateBody(updateDepositSchema),
  ctrl.updateDeposit,
);

// DELETE /api/catering/orders/:id/deposits/:depositId
router.delete(
  '/:id/deposits/:depositId',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateUUID('depositId'),
  ctrl.deleteDeposit,
);

// PATCH /api/catering/orders/:id/deposits/:depositId/pay
router.patch(
  '/:id/deposits/:depositId/pay',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateUUID('depositId'),
  validateBody(markDepositPaidSchema),
  ctrl.markDepositPaid,
);

export default router;
