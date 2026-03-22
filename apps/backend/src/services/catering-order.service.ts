import prisma from '@lib/prisma';
import {
  CateringOrderStatus,
  CateringDiscountType,
  Prisma,
} from '@/prisma-client';
import { logChange } from '../utils/audit-logger';

// ─── Re-export typów (zachowanie publicznego API) ─────────────────────────────
export type {
  CreateOrderItemInput,
  CreateOrderExtraInput,
  CreateCateringOrderInput,
  UpdateCateringOrderInput,
  ListOrdersFilter,
  CreateDepositInput,
  UpdateDepositInput,
} from './catering/catering-order.types';

import type {
  CreateCateringOrderInput,
  UpdateCateringOrderInput,
  ListOrdersFilter,
} from './catering/catering-order.types';

// ─── Helpery i include ──────────────────────────────────────────────────────
import {
  generateOrderNumber,
  resolveDishNames,
  computeTotals,
  badRequest,
  orderInclude,
} from './catering/catering-order.helpers';

// ─── Depozyty (re-export) ──────────────────────────────────────────────────
export {
  createDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositPaid,
} from './catering/catering-deposit.service';

import {
  createDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositPaid,
} from './catering/catering-deposit.service';

// ─── Serwis: tworzenie zamówienia ─────────────────────────────────────────────

export async function createOrder(
  input: CreateCateringOrderInput,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  const orderNumber = await generateOrderNumber();
  const items = input.items ?? [];
  const extras = input.extras ?? [];
  const resolvedItems = await resolveDishNames(items);
  const totals = computeTotals(items, extras, input.discountType, input.discountValue);

  const order = await prisma.cateringOrder.create({
    data: {
      orderNumber,
      clientId: input.clientId,
      createdById: input.createdById,
      templateId: input.templateId ?? null,
      packageId: input.packageId ?? null,
      deliveryType: input.deliveryType ?? 'ON_SITE',
      eventName: input.eventName ?? null,
      eventDate: input.eventDate ?? null,
      eventTime: input.eventTime ?? null,
      eventLocation: input.eventLocation ?? null,
      guestsCount: input.guestsCount ?? 0,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryNotes: input.deliveryNotes ?? null,
      deliveryDate: input.deliveryDate ?? null,
      deliveryTime: input.deliveryTime ?? null,
      subtotal: totals.subtotal,
      extrasTotalPrice: totals.extrasTotalPrice,
      discountType: input.discountType ?? null,
      discountValue: input.discountValue ?? null,
      discountAmount: totals.discountAmount,
      discountReason: input.discountReason ?? null,
      totalPrice: totals.totalPrice,
      contactName: input.contactName ?? null,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
      internalNotes: input.internalNotes ?? null,
      specialRequirements: input.specialRequirements ?? null,
      quoteExpiresAt: input.quoteExpiresAt ? new Date(input.quoteExpiresAt) : null,
      items: {
        create: resolvedItems.map(i => ({
          dishId: i.dishId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
          note: i.note ?? null,
          dishNameSnapshot: i.dishNameSnapshot,
        })),
      },
      extras: {
        create: extras.map(e => ({
          name: e.name,
          description: e.description ?? null,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          totalPrice: e.quantity * e.unitPrice,
          serviceItemId: e.serviceItemId ?? null,
        })),
      },
      history: {
        create: {
          changedById: input.createdById,
          changeType: 'CREATED',
          newValue: 'DRAFT',
        },
      },
    },
    include: orderInclude,
  });

  await logChange({
    userId: input.createdById,
    action: 'CREATE',
    entityType: 'CATERING_ORDER',
    entityId: order.id,
    details: {
      description: `Utworzono zamówienie catering: ${order.orderNumber} — ${order.client.firstName} ${order.client.lastName}`,
      data: {
        orderNumber: order.orderNumber,
        clientId: input.clientId,
        deliveryType: input.deliveryType ?? 'ON_SITE',
        guestsCount: input.guestsCount ?? 0,
        itemsCount: items.length,
        extrasCount: extras.length,
        totalPrice: totals.totalPrice,
      },
    },
  });

  return order;
}

// ─── Serwis: odczyt zamówień ──────────────────────────────────────────────

export async function getOrderById(
  id: string,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }> | null> {
  return prisma.cateringOrder.findUnique({ where: { id }, include: orderInclude });
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }> | null> {
  return prisma.cateringOrder.findUnique({ where: { orderNumber }, include: orderInclude });
}

export async function listOrders(filter: ListOrdersFilter) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.CateringOrderWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.deliveryType) where.deliveryType = filter.deliveryType;
  if (filter.clientId) where.clientId = filter.clientId;

  if (filter.eventDateFrom || filter.eventDateTo) {
    where.eventDate = {};
    if (filter.eventDateFrom)
      (where.eventDate as Prisma.StringFilter).gte = filter.eventDateFrom;
    if (filter.eventDateTo)
      (where.eventDate as Prisma.StringFilter).lte = filter.eventDateTo;
  }

  if (filter.search) {
    const s = filter.search;
    where.OR = [
      { orderNumber: { contains: s, mode: 'insensitive' } },
      { eventName: { contains: s, mode: 'insensitive' } },
      { contactName: { contains: s, mode: 'insensitive' } },
      { client: { firstName: { contains: s, mode: 'insensitive' } } },
      { client: { lastName: { contains: s, mode: 'insensitive' } } },
      { client: { companyName: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.cateringOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
        _count: { select: { items: true, deposits: true } },
      },
    }),
    prisma.cateringOrder.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Serwis: aktualizacja zamówienia ─────────────────────────────────────────

export async function updateOrder(
  id: string,
  input: UpdateCateringOrderInput,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  const existing = await prisma.cateringOrder.findUniqueOrThrow({ where: { id } });
  const oldStatus = existing.status;
  const updateData: Prisma.CateringOrderUpdateInput = {};

  const oldDiscountType = existing.discountType as CateringDiscountType | null;
  const newDiscountType = 'discountType' in input ? input.discountType : oldDiscountType;
  const oldDiscountValue = existing.discountValue != null ? Number(existing.discountValue) : null;
  const newDiscountValue = 'discountValue' in input ? input.discountValue : oldDiscountValue;
  const newDiscountReason = 'discountReason' in input ? input.discountReason : existing.discountReason;

  let discountEvent: string | null = null;
  let discountOldValue: string | null = null;
  let discountNewValue: string | null = null;

  if (!oldDiscountType && newDiscountType) {
    discountEvent = 'DISCOUNT_ADDED';
    discountNewValue = newDiscountType === 'PERCENTAGE'
      ? `${newDiscountValue}%`
      : `${newDiscountValue} PLN`;
  } else if (oldDiscountType && !newDiscountType) {
    discountEvent = 'DISCOUNT_REMOVED';
    discountOldValue = oldDiscountType === 'PERCENTAGE'
      ? `${oldDiscountValue}%`
      : `${oldDiscountValue} PLN`;
  } else if (
    oldDiscountType && newDiscountType && (
      oldDiscountType !== newDiscountType ||
      oldDiscountValue !== newDiscountValue ||
      ('discountReason' in input && input.discountReason !== existing.discountReason)
    )
  ) {
    discountEvent = 'DISCOUNT_UPDATED';
    discountOldValue = oldDiscountType === 'PERCENTAGE'
      ? `${oldDiscountValue}%`
      : `${oldDiscountValue} PLN`;
    discountNewValue = newDiscountType === 'PERCENTAGE'
      ? `${newDiscountValue}%`
      : `${newDiscountValue} PLN`;
  }

  if (input.items !== undefined || input.extras !== undefined) {
    const items = input.items ?? [];
    const extras = input.extras ?? [];
    const resolvedItems = await resolveDishNames(items);
    const totals = computeTotals(
      items,
      extras,
      input.discountType !== undefined
        ? input.discountType
        : (existing.discountType as CateringDiscountType | null),
      input.discountValue !== undefined
        ? input.discountValue
        : Number(existing.discountValue),
    );
    updateData.subtotal = totals.subtotal;
    updateData.extrasTotalPrice = totals.extrasTotalPrice;
    updateData.discountAmount = totals.discountAmount;
    updateData.totalPrice = totals.totalPrice;

    if (input.items !== undefined) {
      updateData.items = {
        deleteMany: {},
        create: resolvedItems.map(i => ({
          dishId: i.dishId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
          note: i.note ?? null,
          dishNameSnapshot: i.dishNameSnapshot,
        })),
      };
    }
    if (input.extras !== undefined) {
      updateData.extras = {
        deleteMany: {},
        create: input.extras.map(e => ({
          name: e.name,
          description: e.description ?? null,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          totalPrice: e.quantity * e.unitPrice,
          serviceItemId: e.serviceItemId ?? null,
        })),
      };
    }
  } else if (input.discountType !== undefined || input.discountValue !== undefined) {
    const cur = { quantity: 1, unitPrice: Number(existing.subtotal) + Number(existing.extrasTotalPrice) };
    const disc = computeTotals(
      [cur],
      [],
      input.discountType !== undefined
        ? input.discountType
        : (existing.discountType as CateringDiscountType | null),
      input.discountValue !== undefined
        ? input.discountValue
        : Number(existing.discountValue),
    );
    updateData.discountAmount = disc.discountAmount;
    updateData.totalPrice = disc.totalPrice;
  }

  if (input.status !== undefined) updateData.status = input.status;
  if (input.deliveryType !== undefined) updateData.deliveryType = input.deliveryType;

  if ('templateId' in input) {
    updateData.template = input.templateId
      ? { connect: { id: input.templateId } }
      : { disconnect: true };
  }
  if ('packageId' in input) {
    updateData.package = input.packageId
      ? { connect: { id: input.packageId } }
      : { disconnect: true };
  }

  if ('eventName' in input) updateData.eventName = input.eventName ?? null;
  if ('eventDate' in input) updateData.eventDate = input.eventDate ?? null;
  if ('eventTime' in input) updateData.eventTime = input.eventTime ?? null;
  if ('eventLocation' in input) updateData.eventLocation = input.eventLocation ?? null;
  if (input.guestsCount !== undefined) updateData.guestsCount = input.guestsCount;
  if ('deliveryAddress' in input) updateData.deliveryAddress = input.deliveryAddress ?? null;
  if ('deliveryNotes' in input) updateData.deliveryNotes = input.deliveryNotes ?? null;
  if ('deliveryDate' in input) updateData.deliveryDate = input.deliveryDate ?? null;
  if ('deliveryTime' in input) updateData.deliveryTime = input.deliveryTime ?? null;
  if ('discountType' in input) updateData.discountType = input.discountType ?? null;
  if ('discountValue' in input) updateData.discountValue = input.discountValue ?? null;
  if ('discountReason' in input) updateData.discountReason = input.discountReason ?? null;
  if ('contactName' in input) updateData.contactName = input.contactName ?? null;
  if ('contactPhone' in input) updateData.contactPhone = input.contactPhone ?? null;
  if ('contactEmail' in input) updateData.contactEmail = input.contactEmail ?? null;
  if ('notes' in input) updateData.notes = input.notes ?? null;
  if ('internalNotes' in input) updateData.internalNotes = input.internalNotes ?? null;
  if ('specialRequirements' in input) updateData.specialRequirements = input.specialRequirements ?? null;
  if ('quoteExpiresAt' in input) {
    updateData.quoteExpiresAt = input.quoteExpiresAt ? new Date(input.quoteExpiresAt) : null;
  }

  if (input.status !== undefined && input.status !== oldStatus) {
    updateData.history = {
      create: {
        changedById: input.changedById ?? existing.createdById,
        changeType: 'STATUS_CHANGE',
        fieldName: 'status',
        oldValue: oldStatus,
        newValue: input.status,
        reason: input.changeReason ?? null,
      },
    };
  }

  const updated = await prisma.cateringOrder.update({
    where: { id },
    data: updateData,
    include: orderInclude,
  });

  const userId = input.changedById ?? existing.createdById;

  if (input.status !== undefined && input.status !== oldStatus) {
    // #217: logChange removed — cateringOrderHistory entry (nested create above) already covers STATUS_CHANGE
  } else {
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'CATERING_ORDER',
      entityId: id,
      details: {
        description: `Zaktualizowano zamówienie ${existing.orderNumber}`,
      },
    });
  }

  if (discountEvent && input.changedById) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId: id,
        changedById: input.changedById,
        changeType: discountEvent,
        fieldName: 'discount',
        oldValue: discountOldValue,
        newValue: discountNewValue,
        reason: newDiscountReason ?? null,
      },
    });
  }

  return updated;
}

// ─── Serwis: zmiana statusu ─────────────────────────────────────────────────

export async function changeOrderStatus(
  id: string,
  status: CateringOrderStatus,
  changedById: string,
  reason?: string | null,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  return updateOrder(id, { status, changedById, changeReason: reason });
}

// ─── Serwis: usuwanie zamówienia ─────────────────────────────────────────────

export async function deleteOrder(id: string, deletedById?: string): Promise<void> {
  const order = await prisma.cateringOrder.findUniqueOrThrow({ where: { id } });
  if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
    badRequest('Można usunąć tylko zamówienia w statusie DRAFT lub CANCELLED');
  }
  await prisma.cateringOrder.delete({ where: { id } });

  await logChange({
    userId: deletedById ?? order.createdById,
    action: 'DELETE',
    entityType: 'CATERING_ORDER',
    entityId: id,
    details: {
      description: `Usunięto zamówienie catering: ${order.orderNumber}`,
      data: { orderNumber: order.orderNumber, status: order.status },
    },
  });
}

// ─── Serwis: historia zamówienia ─────────────────────────────────────────────

export async function getOrderHistory(orderId: string) {
  return prisma.cateringOrderHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: {
      changedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ─── Default export (zachowanie publicznego API) ─────────────────────────────

export default {
  createOrder,
  getOrderById,
  getOrderByNumber,
  listOrders,
  updateOrder,
  changeOrderStatus,
  deleteOrder,
  getOrderHistory,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositPaid,
};
