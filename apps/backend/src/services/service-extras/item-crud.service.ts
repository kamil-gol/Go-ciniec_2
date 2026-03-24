// apps/backend/src/services/service-extras/item-crud.service.ts

/**
 * Service Extra — Item CRUD operations.
 * Extracted from serviceExtra.service.ts for decomposition.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import { logChange, diffObjects } from '../../utils/audit-logger';
import {
  CreateServiceItemDTO,
  UpdateServiceItemDTO,
  ServiceItemResponse,
} from '../../types/serviceExtra.types';
import { VALID_PRICE_TYPES } from './extras.helpers';

export async function getItems(activeOnly: boolean = false): Promise<ServiceItemResponse[]> {
  const where = activeOnly ? { isActive: true } : {};

  const items = await prisma.serviceItem.findMany({
    where,
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
  });

  return items as unknown as ServiceItemResponse[];
}

export async function getItemById(id: string): Promise<ServiceItemResponse> {
  const item = await prisma.serviceItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!item) throw new Error('Nie znaleziono pozycji usługi');
  return item as unknown as ServiceItemResponse;
}

export async function getItemsByCategory(categoryId: string, activeOnly: boolean = false): Promise<ServiceItemResponse[]> {
  const where: Prisma.ServiceItemWhereInput = { categoryId };
  if (activeOnly) where.isActive = true;

  const items = await prisma.serviceItem.findMany({
    where,
    include: { category: true },
    orderBy: { displayOrder: 'asc' },
  });

  return items as unknown as ServiceItemResponse[];
}

export async function createItem(data: CreateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Nazwa pozycji jest wymagana');
  }

  if (!VALID_PRICE_TYPES.includes(data.priceType)) {
    throw new Error(`Nieprawidłowy typ ceny. Użyj: ${VALID_PRICE_TYPES.join(', ')}`);
  }

  // Verify category exists
  const category = await prisma.serviceCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new Error('Nie znaleziono kategorii usług');

  // Auto display order
  let displayOrder = data.displayOrder;
  if (displayOrder === undefined) {
    const maxOrder = await prisma.serviceItem.aggregate({
      where: { categoryId: data.categoryId },
      _max: { displayOrder: true },
    });
    displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
  }

  const item = await prisma.serviceItem.create({
    data: {
      categoryId: data.categoryId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      priceType: data.priceType,
      basePrice: data.priceType === 'FREE' ? 0 : (data.basePrice ?? 0),
      icon: data.icon || null,
      displayOrder,
      requiresNote: data.requiresNote ?? false,
      noteLabel: data.noteLabel?.trim() || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: { category: true },
  });

  await logChange({
    userId,
    action: 'CREATE',
    entityType: 'SERVICE_ITEM',
    entityId: item.id,
    details: {
      description: `Utworzono pozycję usługi: ${item.name} (${category.name})`,
      data: { name: item.name, priceType: item.priceType, basePrice: item.basePrice.toString() },
    },
  });

  return item as unknown as ServiceItemResponse;
}

export async function updateItem(id: string, data: UpdateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
  const existing = await prisma.serviceItem.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!existing) throw new Error('Nie znaleziono pozycji usługi');

  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new Error('Nazwa pozycji nie może być pusta');
  }

  if (data.priceType !== undefined && !VALID_PRICE_TYPES.includes(data.priceType)) {
    throw new Error(`Nieprawidłowy typ ceny. Użyj: ${VALID_PRICE_TYPES.join(', ')}`);
  }

  const updateData: Prisma.ServiceItemUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.priceType !== undefined) updateData.priceType = data.priceType;
  if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.requiresNote !== undefined) updateData.requiresNote = data.requiresNote;
  if (data.noteLabel !== undefined) updateData.noteLabel = data.noteLabel?.trim() || null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // If changing to FREE, reset price
  if (data.priceType === 'FREE') {
    updateData.basePrice = 0;
  }

  const item = await prisma.serviceItem.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  const changes = diffObjects(existing, item);
  if (Object.keys(changes).length > 0) {
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'SERVICE_ITEM',
      entityId: item.id,
      details: {
        description: `Zaktualizowano pozycję usługi: ${item.name}`,
        changes,
      },
    });
  }

  return item as unknown as ServiceItemResponse;
}

export async function deleteItem(id: string, userId: string): Promise<void> {
  const existing = await prisma.serviceItem.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!existing) throw new Error('Nie znaleziono pozycji usługi');

  const usedInReservations = await prisma.reservationExtra.count({
    where: { serviceItemId: id },
  });

  if (usedInReservations > 0) {
    throw new Error(
      `Nie można usunąć — ${usedInReservations} rezerwacji używa tej pozycji. Dezaktywuj zamiast usuwać.`
    );
  }

  await prisma.serviceItem.delete({ where: { id } });

  await logChange({
    userId,
    action: 'DELETE',
    entityType: 'SERVICE_ITEM',
    entityId: id,
    details: {
      description: `Usunięto pozycję usługi: ${existing.name} (${existing.category?.name})`,
      deletedData: { name: existing.name, priceType: existing.priceType },
    },
  });
}
