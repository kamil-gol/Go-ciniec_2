/**
 * Client Controller
 * Handle HTTP requests for client management
 */

import { Request, Response } from 'express';
import clientService from '../services/client.service';
import { CreateClientDTO, UpdateClientDTO, ClientFilters } from '../types/client.types';

export class ClientController {
  /**
   * Create a new client
   * POST /api/clients
   */
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateClientDTO = req.body;

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
    } catch (error: any) {
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
  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const filters: ClientFilters = {
        search: req.query.search as string
      };

      const clients = await clientService.getClients(filters);

      res.status(200).json({
        success: true,
        data: clients,
        count: clients.length
      });
    } catch (error: any) {
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
  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(id);

      res.status(200).json({
        success: true,
        data: client
      });
    } catch (error: any) {
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
  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateClientDTO = req.body;

      const client = await clientService.updateClient(id, data);

      res.status(200).json({
        success: true,
        data: client,
        message: 'Client updated successfully'
      });
    } catch (error: any) {
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
  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await clientService.deleteClient(id);

      res.status(200).json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Client not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete client'
      });
    }
  }
}

export default new ClientController();
