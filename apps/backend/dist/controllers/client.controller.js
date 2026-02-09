/**
 * Client Controller
 * Handle HTTP requests for client management
 */
import clientService from '../services/client.service';
export class ClientController {
    /**
     * Create a new client
     * POST /api/clients
     */
    async createClient(req, res) {
        try {
            const data = req.body;
            // Validate required fields
            if (!data.firstName || !data.lastName || !data.email) {
                res.status(400).json({
                    success: false,
                    error: 'First name, last name, and email are required'
                });
                return;
            }
            const client = await clientService.createClient(data);
            res.status(201).json({
                success: true,
                data: client,
                message: 'Client created successfully'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create client'
            });
        }
    }
    /**
     * Get all clients with optional filters
     * GET /api/clients
     */
    async getClients(req, res) {
        try {
            const filters = {
                search: req.query.search
            };
            const clients = await clientService.getClients(filters);
            res.status(200).json({
                success: true,
                data: clients,
                count: clients.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch clients'
            });
        }
    }
    /**
     * Get client by ID
     * GET /api/clients/:id
     */
    async getClientById(req, res) {
        try {
            const { id } = req.params;
            const client = await clientService.getClientById(id);
            res.status(200).json({
                success: true,
                data: client
            });
        }
        catch (error) {
            const statusCode = error.message === 'Client not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to fetch client'
            });
        }
    }
    /**
     * Update client
     * PUT /api/clients/:id
     */
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const client = await clientService.updateClient(id, data);
            res.status(200).json({
                success: true,
                data: client,
                message: 'Client updated successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Client not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to update client'
            });
        }
    }
    /**
     * Delete client (hard delete)
     * DELETE /api/clients/:id
     */
    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            await clientService.deleteClient(id);
            res.status(200).json({
                success: true,
                message: 'Client deleted successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Client not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to delete client'
            });
        }
    }
}
export default new ClientController();
//# sourceMappingURL=client.controller.js.map