/**
 * Service Extra Controller
 * REST API controller for service extras management
 */

import { Request, Response } from 'express';
import serviceExtraService from '../services/serviceExtra.service';
import { AppError } from '../utils/AppError';
import {
  CreateServiceCategoryDTO,
  UpdateServiceCategoryDTO,
  CreateServiceItemDTO,
  UpdateServiceItemDTO,
  AssignExtraDTO,
  BulkAssignExtrasDTO,
  UpdateReservationExtraDTO,
  ReorderDTO,
} from '../types/serviceExtra.types';

export class ServiceExtraController {

  // ═══════════════════════════════════════════════════════════════
  // 📁 CATEGORIES
  // ═══════════════════════════════════════════════════════════════

  async getCategories(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const categories = await serviceExtraService.getCategories(activeOnly);

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
    });
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const category = await serviceExtraService.getCategoryById(id);

    res.status(200).json({
      success: true,
      data: category,
    });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { name, slug, description, icon, color, displayOrder, isActive, isExclusive } = req.body;

    if (!name) throw AppError.badRequest('Category name is required');
    if (!slug) throw AppError.badRequest('Category slug is required');

    const data: CreateServiceCategoryDTO = {
      name, slug, description, icon, color, displayOrder, isActive, isExclusive,
    };

    const category = await serviceExtraService.createCategory(data, userId);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Kategoria us\u0142ug utworzona pomy\u015blnie',
    });
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { id } = req.params;
    const { name, slug, description, icon, color, displayOrder, isActive, isExclusive } = req.body;

    const data: UpdateServiceCategoryDTO = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (isActive !== undefined) data.isActive = isActive;
    if (isExclusive !== undefined) data.isExclusive = isExclusive;

    const category = await serviceExtraService.updateCategory(id, data, userId);

    res.status(200).json({
      success: true,
      data: category,
      message: 'Kategoria us\u0142ug zaktualizowana',
    });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { id } = req.params;
    await serviceExtraService.deleteCategory(id, userId);

    res.status(200).json({
      success: true,
      message: 'Kategoria us\u0142ug usuni\u0119ta',
    });
  }

  async reorderCategories(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      throw AppError.badRequest('orderedIds array is required');
    }

    const data: ReorderDTO = { orderedIds };
    const categories = await serviceExtraService.reorderCategories(data, userId);

    res.status(200).json({
      success: true,
      data: categories,
      message: 'Kolejno\u015b\u0107 kategorii zaktualizowana',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 ITEMS
  // ═══════════════════════════════════════════════════════════════

  async getItems(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const categoryId = req.query.categoryId as string | undefined;

    let items;
    if (categoryId) {
      items = await serviceExtraService.getItemsByCategory(categoryId, activeOnly);
    } else {
      items = await serviceExtraService.getItems(activeOnly);
    }

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  }

  async getItemById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const item = await serviceExtraService.getItemById(id);

    res.status(200).json({
      success: true,
      data: item,
    });
  }

  async createItem(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const {
      categoryId, name, description, priceType, basePrice,
      icon, displayOrder, requiresNote, noteLabel, isActive,
    } = req.body;

    if (!categoryId) throw AppError.badRequest('Category ID is required');
    if (!name) throw AppError.badRequest('Item name is required');
    if (!priceType) throw AppError.badRequest('Price type is required');

    const data: CreateServiceItemDTO = {
      categoryId, name, description, priceType, basePrice,
      icon, displayOrder, requiresNote, noteLabel, isActive,
    };

    const item = await serviceExtraService.createItem(data, userId);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Pozycja us\u0142ugi utworzona pomy\u015blnie',
    });
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { id } = req.params;
    const {
      name, description, priceType, basePrice,
      icon, displayOrder, requiresNote, noteLabel, isActive,
    } = req.body;

    const data: UpdateServiceItemDTO = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (priceType !== undefined) data.priceType = priceType;
    if (basePrice !== undefined) data.basePrice = basePrice;
    if (icon !== undefined) data.icon = icon;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (requiresNote !== undefined) data.requiresNote = requiresNote;
    if (noteLabel !== undefined) data.noteLabel = noteLabel;
    if (isActive !== undefined) data.isActive = isActive;

    const item = await serviceExtraService.updateItem(id, data, userId);

    res.status(200).json({
      success: true,
      data: item,
      message: 'Pozycja us\u0142ugi zaktualizowana',
    });
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { id } = req.params;
    await serviceExtraService.deleteItem(id, userId);

    res.status(200).json({
      success: true,
      message: 'Pozycja us\u0142ugi usuni\u0119ta',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔗 RESERVATION EXTRAS
  // ═══════════════════════════════════════════════════════════════

  async getReservationExtras(req: Request, res: Response): Promise<void> {
    const { reservationId } = req.params;
    const result = await serviceExtraService.getReservationExtras(reservationId);

    res.status(200).json({
      success: true,
      data: result.extras,
      totalExtrasPrice: result.totalExtrasPrice,
      count: result.count,
    });
  }

  async assignExtra(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { reservationId } = req.params;
    const { serviceItemId, quantity, note, customPrice } = req.body;

    if (!serviceItemId) throw AppError.badRequest('Service item ID is required');

    const data: AssignExtraDTO = { serviceItemId, quantity, note, customPrice };
    const extra = await serviceExtraService.assignExtra(reservationId, data, userId);

    res.status(201).json({
      success: true,
      data: extra,
      message: 'Us\u0142uga dodatkowa dodana do rezerwacji',
    });
  }

  async bulkAssignExtras(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { reservationId } = req.params;
    const { extras } = req.body;

    if (!extras || !Array.isArray(extras)) {
      throw AppError.badRequest('extras array is required');
    }

    const data: BulkAssignExtrasDTO = { extras };
    const result = await serviceExtraService.bulkAssignExtras(reservationId, data, userId);

    res.status(200).json({
      success: true,
      data: result.extras,
      totalExtrasPrice: result.totalExtrasPrice,
      count: result.count,
      message: 'Us\u0142ugi dodatkowe zaktualizowane',
    });
  }

  async updateReservationExtra(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { reservationId, extraId } = req.params;
    const { quantity, note, customPrice, status } = req.body;

    const data: UpdateReservationExtraDTO = {};
    if (quantity !== undefined) data.quantity = quantity;
    if (note !== undefined) data.note = note;
    if (customPrice !== undefined) data.customPrice = customPrice;
    if (status !== undefined) data.status = status;

    const extra = await serviceExtraService.updateReservationExtra(
      reservationId, extraId, data, userId
    );

    res.status(200).json({
      success: true,
      data: extra,
      message: 'Us\u0142uga dodatkowa zaktualizowana',
    });
  }

  async removeReservationExtra(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('User not authenticated');

    const { reservationId, extraId } = req.params;
    await serviceExtraService.removeReservationExtra(reservationId, extraId, userId);

    res.status(200).json({
      success: true,
      message: 'Us\u0142uga dodatkowa usuni\u0119ta z rezerwacji',
    });
  }
}

export default new ServiceExtraController();
