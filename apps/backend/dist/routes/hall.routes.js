/**
 * Hall Routes
 * MIGRATED: asyncHandler + validateUUID
 */
import { Router } from 'express';
import hallController from '../controllers/hall.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
const router = Router();
router.post('/', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
    await hallController.createHall(req, res);
}));
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    await hallController.getHalls(req, res);
}));
router.get('/:id', authMiddleware, validateUUID('id'), asyncHandler(async (req, res) => {
    await hallController.getHallById(req, res);
}));
router.put('/:id', authMiddleware, requireAdmin, validateUUID('id'), asyncHandler(async (req, res) => {
    await hallController.updateHall(req, res);
}));
router.delete('/:id', authMiddleware, requireAdmin, validateUUID('id'), asyncHandler(async (req, res) => {
    await hallController.deleteHall(req, res);
}));
export default router;
//# sourceMappingURL=hall.routes.js.map