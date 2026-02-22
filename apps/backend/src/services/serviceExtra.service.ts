/**
 * Service Extra Service
 * Business logic for service extras management
 * (venue decoration, music, cake, photography, etc.)
 * 
 * Extras are independent from the Menu system — they can be added
 * to a reservation at any stage, without selecting a menu first.
 * 🇵🇱 Spolonizowany — komunikaty po polsku
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logChange, diffObjects } from '../utils/audit-logger';
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

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_PRICE_TYPES = ['FLAT', 'PER_PERSON', 'FREE'];
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

export class ServiceExtraService {

  // ═══════════════════════════════════════════════════════════════
  // 📁 CATEGORIES — CRUD
  // ═══════════════════════════════════════════════════════════════

  async getCategories(activeOnly: boolean = false): Promise<ServiceCategoryResponse[]> {
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

    return categories as any[];
  }

  async getCategoryById(id: string): Promise<ServiceCategoryResponse> {
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        items: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { items: true } },
      },
    });

    if (!category) throw new Error('Nie znaleziono kategorii us\u0142ug');
    return category as any;
  }

  async createCategory(data: CreateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nazwa kategorii jest wymagana');
    }

    if (!data.slug || !SLUG_REGEX.test(data.slug)) {
      throw new Error('Nieprawid\u0142owy format slug. U\u017cyj ma\u0142ych liter, cyfr i my\u015blnik\u00f3w (np. "tort-weselny")');
    }

    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new Error('Kategoria z tym slugiem ju\u017c istnieje');
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
        description: `Utworzono kategori\u0119 us\u0142ug: ${category.name}`,
        data: { name: category.name, slug: category.slug, isExclusive: category.isExclusive },
      },
    });

    return category as any;
  }

  async updateCategory(id: string, data: UpdateServiceCategoryDTO, userId: string): Promise<ServiceCategoryResponse> {
    const existing = await prisma.serviceCategory.findUnique({ where: { id } });
    if (!existing) throw new Error('Nie znaleziono kategorii us\u0142ug');

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nazwa kategorii nie mo\u017ce by\u0107 pusta');
    }

    if (data.slug !== undefined) {
      if (!SLUG_REGEX.test(data.slug)) {
        throw new Error('Nieprawid\u0142owy format slug');
      }
      const slugTaken = await prisma.serviceCategory.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugTaken) throw new Error('Kategoria z tym slugiem ju\u017c istnieje');
    }

    const updateData: Record<string, any> = {};
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
          description: `Zaktualizowano kategori\u0119 us\u0142ug: ${category.name}`,
          changes,
        },
      });
    }

    return category as any;
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!existing) throw new Error('Nie znaleziono kategorii us\u0142ug');

    // Check if any items in this category are used in reservations
    const usedInReservations = await prisma.reservationExtra.count({
      where: { serviceItem: { categoryId: id } },
    });

    if (usedInReservations > 0) {
      throw new Error(
        `Nie mo\u017cna usun\u0105\u0107 kategorii \u2014 ${usedInReservations} rezerwacji u\u017cywa pozycji z tej kategorii. Dezaktywuj zamiast usuwa\u0107.`
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
        description: `Usuni\u0119to kategori\u0119 us\u0142ug: ${existing.name}`,
        deletedData: { name: existing.name, slug: existing.slug },
      },
    });
  }

  async reorderCategories(data: ReorderDTO, userId: string): Promise<ServiceCategoryResponse[]> {
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
        description: `Zmieniono kolejno\u015b\u0107 kategorii us\u0142ug`,
        orderedIds: data.orderedIds,
      },
    });

    return this.getCategories();
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 ITEMS — CRUD
  // ═══════════════════════════════════════════════════════════════

  async getItems(activeOnly: boolean = false): Promise<ServiceItemResponse[]> {
    const where = activeOnly ? { isActive: true } : {};

    const items = await prisma.serviceItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
    });

    return items as any[];
  }

  async getItemById(id: string): Promise<ServiceItemResponse> {
    const item = await prisma.serviceItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item) throw new Error('Nie znaleziono pozycji us\u0142ugi');
    return item as any;
  }

  async getItemsByCategory(categoryId: string, activeOnly: boolean = false): Promise<ServiceItemResponse[]> {
    const where: any = { categoryId };
    if (activeOnly) where.isActive = true;

    const items = await prisma.serviceItem.findMany({
      where,
      include: { category: true },
      orderBy: { displayOrder: 'asc' },
    });

    return items as any[];
  }

  async createItem(data: CreateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nazwa pozycji jest wymagana');
    }

    if (!VALID_PRICE_TYPES.includes(data.priceType)) {
      throw new Error(`Nieprawid\u0142owy typ ceny. U\u017cyj: ${VALID_PRICE_TYPES.join(', ')}`);
    }

    // Verify category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new Error('Nie znaleziono kategorii us\u0142ug');

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
        description: `Utworzono pozycj\u0119 us\u0142ugi: ${item.name} (${category.name})`,
        data: { name: item.name, priceType: item.priceType, basePrice: item.basePrice.toString() },
      },
    });

    return item as any;
  }

  async updateItem(id: string, data: UpdateServiceItemDTO, userId: string): Promise<ServiceItemResponse> {
    const existing = await prisma.serviceItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) throw new Error('Nie znaleziono pozycji us\u0142ugi');

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nazwa pozycji nie mo\u017ce by\u0107 pusta');
    }

    if (data.priceType !== undefined && !VALID_PRICE_TYPES.includes(data.priceType)) {
      throw new Error(`Nieprawid\u0142owy typ ceny. U\u017cyj: ${VALID_PRICE_TYPES.join(', ')}`);
    }

    const updateData: Record<string, any> = {};
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
          description: `Zaktualizowano pozycj\u0119 us\u0142ugi: ${item.name}`,
          changes,
        },
      });
    }

    return item as any;
  }

  async deleteItem(id: string, userId: string): Promise<void> {
    const existing = await prisma.serviceItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) throw new Error('Nie znaleziono pozycji us\u0142ugi');

    const usedInReservations = await prisma.reservationExtra.count({
      where: { serviceItemId: id },
    });

    if (usedInReservations > 0) {
      throw new Error(
        `Nie mo\u017cna usun\u0105\u0107 \u2014 ${usedInReservations} rezerwacji u\u017cywa tej pozycji. Dezaktywuj zamiast usuwa\u0107.`
      );
    }

    await prisma.serviceItem.delete({ where: { id } });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'SERVICE_ITEM',
      entityId: id,
      details: {
        description: `Usuni\u0119to pozycj\u0119 us\u0142ugi: ${existing.name} (${existing.category?.name})`,
        deletedData: { name: existing.name, priceType: existing.priceType },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔗 RESERVATION EXTRAS — Assignment & Management
  // ═══════════════════════════════════════════════════════════════

  async getReservationExtras(reservationId: string): Promise<ReservationExtrasWithTotal> {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');

    const extras = await prisma.reservationExtra.findMany({
      where: { reservationId },
      include: {
        serviceItem: {
          include: { category: true },
        },
      },
      orderBy: [
        { serviceItem: { category: { displayOrder: 'asc' } } },
        { serviceItem: { displayOrder: 'asc' } },
      ],
    });

    const totalExtrasPrice = extras.reduce(
      (sum, e) => sum + Number(e.totalPrice),
      0
    );

    return {
      extras: extras as any[],
      totalExtrasPrice,
      count: extras.length,
    };
  }

  async assignExtra(
    reservationId: string,
    data: AssignExtraDTO,
    userId: string
  ): Promise<ReservationExtraResponse> {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');

    const item = await prisma.serviceItem.findUnique({
      where: { id: data.serviceItemId },
      include: { category: true },
    });
    if (!item) throw new Error('Nie znaleziono pozycji us\u0142ugi');
    if (!item.isActive) throw new Error('Pozycja us\u0142ugi jest nieaktywna');

    // Check if item requires a note
    if (item.requiresNote && (!data.note || data.note.trim().length === 0)) {
      throw new Error(`Pole "${item.noteLabel || 'Uwagi'}" jest wymagane dla tej pozycji`);
    }

    // Handle exclusive categories — only 1 item from this category per reservation
    // When category.isExclusive is true, adding a new item auto-replaces the existing one
    if (item.category?.isExclusive) {
      const existingFromCategory = await prisma.reservationExtra.findMany({
        where: {
          reservationId,
          serviceItem: { categoryId: item.categoryId },
        },
        include: { serviceItem: true },
      });

      if (existingFromCategory.length > 0) {
        // Auto-replace: remove existing item(s) from this exclusive category
        await prisma.reservationExtra.deleteMany({
          where: {
            id: { in: existingFromCategory.map((e) => e.id) },
          },
        });

        // Log the auto-replacement
        const replacedNames = existingFromCategory.map(e => e.serviceItem?.name || 'Nieznana').join(', ');
        await logChange({
          userId,
          action: 'UPDATE',
          entityType: 'RESERVATION',
          entityId: reservationId,
          details: {
            description: `Automatycznie zast\u0105piono w kategorii wy\u0142\u0105cznej "${item.category.name}": ${replacedNames} \u2192 ${item.name}`,
            field: 'extras',
            data: {
              categoryName: item.category.name,
              replaced: replacedNames,
              newItem: item.name,
            },
          },
        });
      }
    }

    // Check if already assigned (upsert)
    const existingExtra = await prisma.reservationExtra.findFirst({
      where: { reservationId, serviceItemId: data.serviceItemId },
    });

    if (existingExtra) {
      throw new Error('Ta pozycja jest ju\u017c dodana do rezerwacji');
    }

    // Calculate price
    const quantity = data.quantity ?? 1;
    const unitPrice = data.customPrice !== undefined ? data.customPrice : Number(item.basePrice);
    const totalPrice = this.calculateTotalPrice(
      item.priceType,
      unitPrice,
      quantity,
      reservation.adults,
      reservation.children
    );

    const extra = await prisma.reservationExtra.create({
      data: {
        reservationId,
        serviceItemId: data.serviceItemId,
        quantity,
        unitPrice,
        priceType: item.priceType,
        totalPrice,
        note: data.note?.trim() || null,
        status: 'PENDING',
      },
      include: {
        serviceItem: { include: { category: true } },
      },
    });

    // Update reservation extras total
    await this.recalculateExtrasTotal(reservationId);

    // Log on extra-level (item audit trail)
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'RESERVATION_EXTRA',
      entityId: extra.id,
      details: {
        description: `Dodano us\u0142ug\u0119 dodatkow\u0105: ${item.name} do rezerwacji`,
        data: {
          reservationId,
          itemName: item.name,
          priceType: item.priceType,
          totalPrice: totalPrice.toString(),
        },
      },
    });

    // Log on reservation-level (timeline visibility)
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Dodano us\u0142ug\u0119 dodatkow\u0105: ${item.name} (${totalPrice} z\u0142)`,
        field: 'extras',
        data: {
          itemName: item.name,
          category: item.category?.name,
          totalPrice: totalPrice.toString(),
        },
      },
    });

    return extra as any;
  }

  async bulkAssignExtras(
    reservationId: string,
    data: BulkAssignExtrasDTO,
    userId: string
  ): Promise<ReservationExtrasWithTotal> {
    // Remove all existing extras
    await prisma.reservationExtra.deleteMany({
      where: { reservationId },
    });

    // Add all new ones
    for (const extraData of data.extras) {
      await this.assignExtra(reservationId, extraData, userId);
    }

    await this.recalculateExtrasTotal(reservationId);

    await logChange({
      userId,
      action: 'BULK_ASSIGN',
      entityType: 'RESERVATION_EXTRA',
      entityId: reservationId,
      details: {
        description: `Zaktualizowano us\u0142ugi dodatkowe rezerwacji (${data.extras.length} pozycji)`,
        count: data.extras.length,
      },
    });

    // Log on reservation-level (timeline visibility)
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Zaktualizowano zbiorczo us\u0142ugi dodatkowe (${data.extras.length} pozycji)`,
        field: 'extras',
        data: { count: data.extras.length },
      },
    });

    return this.getReservationExtras(reservationId);
  }

  async updateReservationExtra(
    reservationId: string,
    extraId: string,
    data: UpdateReservationExtraDTO,
    userId: string
  ): Promise<ReservationExtraResponse> {
    const existing = await prisma.reservationExtra.findFirst({
      where: { id: extraId, reservationId },
      include: { serviceItem: true },
    });
    if (!existing) throw new Error('Nie znaleziono dodatku rezerwacji');

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');

    if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
      throw new Error(`Nieprawid\u0142owy status. U\u017cyj: ${VALID_STATUSES.join(', ')}`);
    }

    const updateData: Record<string, any> = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.note !== undefined) updateData.note = data.note?.trim() || null;
    if (data.customPrice !== undefined) {
      updateData.unitPrice = data.customPrice ?? Number(existing.serviceItem.basePrice);
    }
    if (data.status !== undefined) updateData.status = data.status;

    // Recalculate total price if quantity or price changed
    const newQuantity = data.quantity ?? existing.quantity;
    const newUnitPrice = updateData.unitPrice !== undefined
      ? updateData.unitPrice
      : Number(existing.unitPrice);

    updateData.totalPrice = this.calculateTotalPrice(
      existing.priceType,
      newUnitPrice,
      newQuantity,
      reservation.adults,
      reservation.children
    );

    const extra = await prisma.reservationExtra.update({
      where: { id: extraId },
      data: updateData,
      include: {
        serviceItem: { include: { category: true } },
      },
    });

    await this.recalculateExtrasTotal(reservationId);

    const changes = diffObjects(existing, extra);
    if (Object.keys(changes).length > 0) {
      // Log on extra-level (item audit trail)
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'RESERVATION_EXTRA',
        entityId: extra.id,
        details: {
          description: `Zaktualizowano us\u0142ug\u0119 dodatkow\u0105: ${existing.serviceItem.name}`,
          changes,
        },
      });

      // Log on reservation-level (timeline visibility)
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Zmieniono us\u0142ug\u0119 dodatkow\u0105: ${existing.serviceItem.name}`,
          field: 'extras',
          changes,
        },
      });
    }

    return extra as any;
  }

  async removeReservationExtra(
    reservationId: string,
    extraId: string,
    userId: string
  ): Promise<void> {
    const existing = await prisma.reservationExtra.findFirst({
      where: { id: extraId, reservationId },
      include: { serviceItem: true },
    });
    if (!existing) throw new Error('Nie znaleziono dodatku rezerwacji');

    await prisma.reservationExtra.delete({ where: { id: extraId } });

    await this.recalculateExtrasTotal(reservationId);

    // Log on extra-level (item audit trail)
    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'RESERVATION_EXTRA',
      entityId: extraId,
      details: {
        description: `Usuni\u0119to us\u0142ug\u0119 dodatkow\u0105: ${existing.serviceItem.name}`,
        deletedData: {
          itemName: existing.serviceItem.name,
          totalPrice: existing.totalPrice.toString(),
        },
      },
    });

    // Log on reservation-level (timeline visibility)
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Usuni\u0119to us\u0142ug\u0119 dodatkow\u0105: ${existing.serviceItem.name} (${existing.totalPrice} z\u0142)`,
        field: 'extras',
        data: {
          removedItem: existing.serviceItem.name,
          removedPrice: existing.totalPrice.toString(),
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private calculateTotalPrice(
    priceType: string,
    unitPrice: number,
    quantity: number,
    adults: number,
    children: number
  ): number {
    switch (priceType) {
      case 'FREE':
        return 0;
      case 'PER_PERSON':
        return unitPrice * (adults + children) * quantity;
      case 'FLAT':
      default:
        return unitPrice * quantity;
    }
  }

  private async recalculateExtrasTotal(reservationId: string): Promise<void> {
    const extras = await prisma.reservationExtra.findMany({
      where: { reservationId, status: { not: 'CANCELLED' } },
    });

    const total = extras.reduce((sum, e) => sum + Number(e.totalPrice), 0);

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { extrasTotalPrice: new Decimal(total) },
    });
  }
}

export default new ServiceExtraService();
