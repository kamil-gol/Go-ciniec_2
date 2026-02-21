/**
 * Client Routes
 * MIGRATED: asyncHandler + validateUUID
 */
import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
const router = Router();
router.post('/', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
    await clientController.createClient(req, res);
}));
router.get('/', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
    await clientController.getClients(req, res);
}));
router.get('/:id', authMiddleware, requireStaff, validateUUID('id'), asyncHandler(async (req, res) => {
    await clientController.getClientById(req, res);
}));
router.put('/:id', authMiddleware, requireStaff, validateUUID('id'), asyncHandler(async (req, res) => {
    await clientController.updateClient(req, res);
}));
router.delete('/:id', authMiddleware, requireAdmin, validateUUID('id'), asyncHandler(async (req, res) => {
    await clientController.deleteClient(req, res);
}));
export default router;
//# sourceMappingURL=client.routes.js.map