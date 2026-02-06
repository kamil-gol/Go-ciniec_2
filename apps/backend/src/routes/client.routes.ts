/**
 * Client Routes
 * Define routes for client management
 */

import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';

const router = Router();

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/', authMiddleware, requireStaff, (req, res) => {
  clientController.createClient(req, res);
});

/**
 * @route   GET /api/clients
 * @desc    Get all clients with optional filters
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/', authMiddleware, requireStaff, (req, res) => {
  clientController.getClients(req, res);
});

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/:id', authMiddleware, requireStaff, (req, res) => {
  clientController.getClientById(req, res);
});

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id', authMiddleware, requireStaff, (req, res) => {
  clientController.updateClient(req, res);
});

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client (soft delete)
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  clientController.deleteClient(req, res);
});

export default router;
