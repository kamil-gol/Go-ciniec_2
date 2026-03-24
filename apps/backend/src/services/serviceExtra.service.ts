/**
 * Service Extra Service
 * Business logic for service extras management
 * (venue decoration, music, cake, photography, etc.)
 *
 * Extras are independent from the Menu system — they can be added
 * to a reservation at any stage, without selecting a menu first.
 *
 * Decomposed: logic extracted to service-extras/ sub-modules.
 * This file is a thin facade preserving the original public API.
 */

import {
  CreateServiceCategoryDTO,
  UpdateServiceCategoryDTO,
  CreateServiceItemDTO,
  UpdateServiceItemDTO,
  AssignExtraDTO,
  BulkAssignExtrasDTO,
  UpdateReservationExtraDTO,
  ServiceCategoryResponse,
  ServiceItemResponse,
  ReservationExtraResponse,
  ReservationExtrasWithTotal,
  ReorderDTO,
} from '../types/serviceExtra.types';

import * as categoryCrud from './service-extras/category-crud.service';
import * as itemCrud from './service-extras/item-crud.service';
import * as reservationExtras from './service-extras/reservation-extras.service';
import { calculateTotalPrice } from './service-extras/extras.helpers';

export class ServiceExtraService {

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES — CRUD
  // ═══════════════════════════════════════════════════════════════

  getCategories(activeOnly?: boolean): Promise<ServiceCategoryResponse[]> {
    return categoryCrud.getCategories(activeOnly);
  }

  getCategoryById(id: string): Promise<ServiceCategoryResponse> {
    return categoryCrud.getCategoryById(id);
  }

  createCategory(data: CreateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
    return categoryCrud.createCategory(data, userId);
  }

  updateCategory(id: string, data: UpdateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
    return categoryCrud.updateCategory(id, data, userId);
  }

  deleteCategory(id: string, userId: string): Promise<void> {
    return categoryCrud.deleteCategory(id, userId);
  }

  reorderCategories(data: ReorderDTO, userId: string): Promise<ServiceCategoryResponse[]> {
    return categoryCrud.reorderCategories(data, userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // ITEMS — CRUD
  // ═══════════════════════════════════════════════════════════════

  getItems(activeOnly?: boolean): Promise<ServiceItemResponse[]> {
    return itemCrud.getItems(activeOnly);
  }

  getItemById(id: string): Promise<ServiceItemResponse> {
    return itemCrud.getItemById(id);
  }

  getItemsByCategory(categoryId: string, activeOnly?: boolean): Promise<ServiceItemResponse[]> {
    return itemCrud.getItemsByCategory(categoryId, activeOnly);
  }

  createItem(data: CreateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
    return itemCrud.createItem(data, userId);
  }

  updateItem(id: string, data: UpdateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
    return itemCrud.updateItem(id, data, userId);
  }

  deleteItem(id: string, userId: string): Promise<void> {
    return itemCrud.deleteItem(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESERVATION EXTRAS — Assignment & Management
  // ═══════════════════════════════════════════════════════════════

  getReservationExtras(reservationId: string): Promise<ReservationExtrasWithTotal> {
    return reservationExtras.getReservationExtras(reservationId);
  }

  assignExtra(reservationId: string, data: AssignExtraDTO, userId: string): Promise<ReservationExtraResponse> {
    return reservationExtras.assignExtra(reservationId, data, userId);
  }

  bulkAssignExtras(reservationId: string, data: BulkAssignExtrasDTO, userId: string): Promise<ReservationExtrasWithTotal> {
    return reservationExtras.bulkAssignExtras(reservationId, data, userId);
  }

  updateReservationExtra(reservationId: string, extraId: string, data: UpdateReservationExtraDTO, userId: string): Promise<ReservationExtraResponse> {
    return reservationExtras.updateReservationExtra(reservationId, extraId, data, userId);
  }

  removeReservationExtra(reservationId: string, extraId: string, userId: string): Promise<void> {
    return reservationExtras.removeReservationExtra(reservationId, extraId, userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS (kept for backward compat — delegates to shared)
  // ═══════════════════════════════════════════════════════════════

  private calculateTotalPrice(
    priceType: string,
    unitPrice: number,
    quantity: number,
    adults: number,
    children: number,
  ): number {
    return calculateTotalPrice(priceType, unitPrice, quantity, adults, children);
  }
}

export default new ServiceExtraService();
