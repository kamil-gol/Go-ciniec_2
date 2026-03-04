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
} from '../validation/catering-order.validation';
import * as ctrl from '../controllers/catering-order.controller';

const router = Router();

// ── Lista zamówień z filtrami ──────────────────────────────────────────────
// GET /api/catering/orders
router.get(
  '/',
  authenticate,
  requirePermission('catering:read'),
  ctrl.listOrders,
);

// ── Szczegóły zamówienia ────────────────────────────────────────────────────
// GET /api/catering/orders/:id
router.get(
  '/:id',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  ctrl.getOrder,
);

// ── Utwórz zamówienie ───────────────────────────────────────────────────────
// POST /api/catering/orders
router.post(
  '/',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateBody(createOrderSchema),
  ctrl.createOrder,
);

// ── Aktualizuj zamówienie ───────────────────────────────────────────────────
// PATCH /api/catering/orders/:id
router.patch(
  '/:id',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(updateOrderSchema),
  ctrl.updateOrder,
);

// ── Zmień status ────────────────────────────────────────────────────────────
// PATCH /api/catering/orders/:id/status
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(changeStatusSchema),
  ctrl.changeStatus,
);

// ── Usuń zamówienie (tylko DRAFT/CANCELLED) ─────────────────────────────────
// DELETE /api/catering/orders/:id
router.delete(
  '/:id',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  ctrl.deleteOrder,
);

// ── Historia zmian (timeline) ───────────────────────────────────────────────
// GET /api/catering/orders/:id/history
router.get(
  '/:id/history',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  ctrl.getHistory,
);

// ── Depozyty zamówienia ─────────────────────────────────────────────────────
// POST /api/catering/orders/:id/deposits
router.post(
  '/:id/deposits',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateBody(createDepositSchema),
  ctrl.createDeposit,
);

// PATCH /api/catering/orders/:id/deposits/:depositId/pay
router.patch(
  '/:id/deposits/:depositId/pay',
  authenticate,
  requirePermission('catering:manage_orders'),
  validateUUID('id'),
  validateUUID('depositId'),
  ctrl.markDepositPaid,
);

export default router;
