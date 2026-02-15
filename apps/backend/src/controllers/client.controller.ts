/**
 * Client Controller
 * MIGRATED: AppError + no try/catch
 */

import { Request, Response } from 'express';
import clientService from '../services/client.service';
import { AppError } from '../utils/AppError';
import { CreateClientDTO, UpdateClientDTO, ClientFilters } from '../types/client.types';

export class ClientController {
  async createClient(req: Request, res: Response): Promise<void> {
    const data: CreateClientDTO = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    if (!data.firstName || !data.lastName || !data.phone) {
      throw AppError.badRequest('Imię, nazwisko i telefon są wymagane');
    }

    // Walidacja formatu email jeśli podany
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    // Ustaw email na null jeśli pusty string
    if (!data.email || data.email.trim() === '') {
      data.email = undefined;
    }

    const client = await clientService.createClient(data, userId);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  }

  async getClients(req: Request, res: Response): Promise<void> {
    const filters: ClientFilters = {
      search: req.query.search as string
    };

    const clients = await clientService.getClients(filters);

    res.status(200).json({
      success: true,
      data: clients,
      count: clients.length
    });
  }

  async getClientById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const client = await clientService.getClientById(id);

    if (!client) throw AppError.notFound('Client');

    res.status(200).json({
      success: true,
      data: client
    });
  }

  async updateClient(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateClientDTO = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    // Walidacja formatu email jeśli podany
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    const client = await clientService.updateClient(id, data, userId);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  }

  async deleteClient(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    await clientService.deleteClient(id, userId);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  }
}

export default new ClientController();
