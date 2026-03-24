// apps/backend/src/services/service-extras/category-crud.service.ts

/**
 * Service Extra — Category CRUD operations.
 * Extracted from serviceExtra.service.ts for decomposition.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import { logChange, diffObjects } from '../../utils/audit-logger';
import {
  CreateServiceCategoryDTO,
  UpdateServiceCategoryDTO,
  ServiceCategoryResponse,
  ReorderDTO,
} from '../../types/serviceExtra.types';
import { SLUG_REGEX } from './extras.helpers';

export async function getCategories(activeOnly: boolean = false): Promise<ServiceCategoryResponse[]> {
  const where = activeOnly ? { isActive: true } : {};

  const categories = await prisma.serviceCategory.findMany({
    where,
    include: {
      items: {
        where: activeOnly ? { isActive: true } : {},
        orderBy: { displayOrder: 'asc' },
      },
      _count: { select: { items: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return categories as unknown as ServiceCategoryResponse[];
}

export async function getCategoryById(id: string): Promise<ServiceCategoryResponse> {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      items: { orderBy: { displayOrder: 'asc' } },
      _count: { select: { items: true } },
    },
  });

  if (!category) throw new Error('Nie znaleziono kategorii usług');
  return category as unknown as ServiceCategoryResponse;
}

export async function createCategory(data: CreateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Nazwa kategorii jest wymagana');
  }

  if (!data.slug || !SLUG_REGEX.test(data.slug)) {
    throw new Error('Nieprawidłowy format slug. Użyj małych liter, cyfr i myślników (np. "tort-weselny")');
  }

  const existing = await prisma.serviceCategory.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new Error('Kategoria z tym slugiem już istnieje');
  }

  // Auto display order
  let displayOrder = data.displayOrder;
  if (displayOrder === undefined) {
    const maxOrder = await prisma.serviceCategory.aggregate({
      _max: { displayOrder: true },
    });
    displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
  }

  const category = await prisma.serviceCategory.create({
    data: {
      name: data.name.trim(),
      slug: data.slug,
      description: data.description?.trim() || null,
      icon: data.icon || null,
      color: data.color || null,
      displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isExclusive: data.isExclusive ?? false,
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  await logChange({
    userId,
    action: 'CREATE',
    entityType: 'SERVICE_CATEGORY',
    entityId: category.id,
    details: {
      description: `Utworzono kategorię usług: ${category.name}`,
      data: { name: category.name, slug: category.slug, isExclusive: category.isExclusive },
    },
  });

  return category as unknown as ServiceCategoryResponse;
}

export async function updateCategory(id: string, data: UpdateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new Error('Nie znaleziono kategorii usług');

  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new Error('Nazwa kategorii nie może być pusta');
  }

  if (data.slug !== undefined) {
    if (!SLUG_REGEX.test(data.slug)) {
      throw new Error('Nieprawidłowy format slug');
    }
    const slugTaken = await prisma.serviceCategory.findFirst({
      where: { slug: data.slug, id: { not: id } },
    });
    if (slugTaken) throw new Error('Kategoria z tym slugiem już istnieje');
  }

  const updateData: Prisma.ServiceCategoryUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isExclusive !== undefined) updateData.isExclusive = data.isExclusive;

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: updateData,
    include: {
      items: { orderBy: { displayOrder: 'asc' } },
      _count: { select: { items: true } },
    },
  });

  const changes = diffObjects(existing, category);
  if (Object.keys(changes).length > 0) {
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'SERVICE_CATEGORY',
      entityId: category.id,
      details: {
        description: `Zaktualizowano kategorię usług: ${category.name}`,
        changes,
      },
    });
  }

  return category as unknown as ServiceCategoryResponse;
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) throw new Error('Nie znaleziono kategorii usług');

  // Check if any items in this category are used in reservations
  const usedInReservations = await prisma.reservationExtra.count({
    where: { serviceItem: { categoryId: id } },
  });

  if (usedInReservations > 0) {
    throw new Error(
      `Nie można usunąć kategorii — ${usedInReservations} rezerwacji używa pozycji z tej kategorii. Dezaktywuj zamiast usuwać.`
    );
  }

  // Delete category (cascade deletes items)
  await prisma.serviceCategory.delete({ where: { id } });

  await logChange({
    userId,
    action: 'DELETE',
    entityType: 'SERVICE_CATEGORY',
    entityId: id,
    details: {
      description: `Usunięto kategorię usług: ${existing.name}`,
      deletedData: { name: existing.name, slug: existing.slug },
    },
  });
}

export async function reorderCategories(data: ReorderDTO, userId: string): Promise<ServiceCategoryResponse[]> {
  const updates = data.orderedIds.map((id, index) =>
    prisma.serviceCategory.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  await prisma.$transaction(updates);

  await logChange({
    userId,
    action: 'REORDER',
    entityType: 'SERVICE_CATEGORY',
    entityId: 'batch',
    details: {
      description: `Zmieniono kolejność kategorii usług`,
      orderedIds: data.orderedIds,
    },
  });

  return getCategories();
}
