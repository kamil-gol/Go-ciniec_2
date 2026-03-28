/**
 * Client Routes
 * Extended with contact management (#150 Klienci 2.0)
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
import { validateBody } from '../middlewares/validateBody';
import { createClientSchema, updateClientSchema, addContactSchema, updateContactSchema } from '../validation/client.validation';

const router = Router();

// ── Client CRUD ─────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  requireStaff,
  validateBody(createClientSchema),
  asyncHandler(async (req, res) => {
    await clientController.createClient(req, res);
  })
);

router.get(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await clientController.getClients(req, res);
  })
);

router.get(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await clientController.getClientById(req, res);
  })
);

// Podsumowanie rezerwacji klienta — używane przed usunięciem (#147)
router.get(
  '/:id/reservation-summary',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await clientController.getClientReservationSummary(req, res);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  validateBody(updateClientSchema),
  asyncHandler(async (req, res) => {
    await clientController.updateClient(req, res);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await clientController.deleteClient(req, res);
  })
);

// ── Client Contacts (#150 Klienci 2.0) ──────────────────

router.post(
  '/:id/contacts',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  validateBody(addContactSchema),
  asyncHandler(async (req, res) => {
    await clientController.addContact(req, res);
  })
);

router.put(
  '/:id/contacts/:contactId',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  validateUUID('contactId'),
  validateBody(updateContactSchema),
  asyncHandler(async (req, res) => {
    await clientController.updateContact(req, res);
  })
);

router.delete(
  '/:id/contacts/:contactId',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  validateUUID('contactId'),
  asyncHandler(async (req, res) => {
    await clientController.removeContact(req, res);
  })
);

export default router;
