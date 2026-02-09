/**
 * Client Controller
 * Handle HTTP requests for client management
 */
import { Request, Response } from 'express';
export declare class ClientController {
    /**
     * Create a new client
     * POST /api/clients
     */
    createClient(req: Request, res: Response): Promise<void>;
    /**
     * Get all clients with optional filters
     * GET /api/clients
     */
    getClients(req: Request, res: Response): Promise<void>;
    /**
     * Get client by ID
     * GET /api/clients/:id
     */
    getClientById(req: Request, res: Response): Promise<void>;
    /**
     * Update client
     * PUT /api/clients/:id
     */
    updateClient(req: Request, res: Response): Promise<void>;
    /**
     * Delete client (hard delete)
     * DELETE /api/clients/:id
     */
    deleteClient(req: Request, res: Response): Promise<void>;
}
declare const _default: ClientController;
export default _default;
//# sourceMappingURL=client.controller.d.ts.map