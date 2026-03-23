/**
 * Client Controller
 * Extended with company support + ContactCRUD (#150 Klienci 2.0)
 * MIGRATED: AppError + no try/catch
 */

import { Request, Response } from 'express';
import clientService from '../services/client.service';
import { AppError } from '../utils/AppError';
import { CreateClientDTO, UpdateClientDTO, ClientFilters, CreateClientContactDTO, UpdateClientContactDTO } from '../types/client.types';

export class ClientController {
  async createClient(req: Request, res: Response): Promise<void> {
    const data: CreateClientDTO = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    if (!data.firstName || !data.lastName || !data.phone) {
      throw AppError.badRequest('Imię, nazwisko i telefon są wymagane');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    /* istanbul ignore next -- edge case: whitespace-only email */
    if (!data.email || data.email.trim() === '') {
      data.email = undefined;
    }

    const client = await clientService.createClient(data, userId);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  }

  async getClients(req: Request, res: Response): Promise<void> {
    const filters: ClientFilters = {
      search: req.query.search as string,
      clientType: req.query.clientType as ClientFilters['clientType'],
      includeDeleted: req.query.includeDeleted === 'true',
    };

    const clients = await clientService.getClients(filters);

    res.status(200).json({
      success: true,
      data: clients,
      count: clients.length,
    });
  }

  async getClientById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const client = await clientService.getClientById(id);

    if (!client) throw AppError.notFound('Client');

    res.status(200).json({
      success: true,
      data: client,
    });
  }

  async updateClient(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateClientDTO = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw AppError.badRequest('Nieprawidłowy format adresu email');
    }

    const client = await clientService.updateClient(id, data, userId);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  }

  async deleteClient(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    await clientService.deleteClient(id, userId);

    res.status(200).json({
      success: true,
      message: 'Dane klienta zostały zanonimizowane',
    });
  }

  async getClientReservationSummary(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const summary = await clientService.getClientReservationSummary(id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }

  // ═══════════════════════════════════════════════════════
  // CLIENT CONTACTS
  // ═══════════════════════════════════════════════════════

  async addContact(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: CreateClientContactDTO = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized('User not authenticated');
    if (!data.firstName || !data.lastName) {
      throw AppError.badRequest('Imię i nazwisko osoby kontaktowej są wymagane');
    }

    const contact = await clientService.addContact(id, data, userId);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact added successfully',
    });
  }

  async updateContact(req: Request, res: Response): Promise<void> {
    const { id, contactId } = req.params;
    const data: UpdateClientContactDTO = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized('User not authenticated');

    const contact = await clientService.updateContact(id, contactId, data, userId);

    res.status(200).json({
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    });
  }

  async removeContact(req: Request, res: Response): Promise<void> {
    const { id, contactId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized('User not authenticated');

    await clientService.removeContact(id, contactId, userId);

    res.status(200).json({
      success: true,
      message: 'Contact removed successfully',
    });
  }
}

export default new ClientController();
