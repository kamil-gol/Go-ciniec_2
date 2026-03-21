import prisma from '@lib/prisma';
import {
  CateringOrderStatus,
  CateringDeliveryType,
  CateringDiscountType,
  Prisma,
} from '@/generated/prisma';
import { logChange } from '../utils/audit-logger';

// ─── Auto-numeracja: CAT-YYYY-XXXXX ────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.cateringOrder.count({
    where: { orderNumber: { startsWith: `CAT-${year}-` } },
  });
  const seq = String(count + 1).padStart(5, '0');
  return `CAT-${year}-${seq}`;
}

// ─── Typy wejściowe ─────────────────────────────────────────────────────

export interface CreateOrderItemInput {
  dishId: string;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface CreateOrderExtraInput {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  serviceItemId?: string | null;
}

export interface CreateCateringOrderInput {
  clientId: string;
  createdById: string;
  templateId?: string | null;
  packageId?: string | null;
  deliveryType?: CateringDeliveryType;
  eventName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  guestsCount?: number;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  discountType?: CateringDiscountType | null;
  discountValue?: number | null;
  discountReason?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  specialRequirements?: string | null;
  quoteExpiresAt?: string | null;
  items?: CreateOrderItemInput[];
  extras?: CreateOrderExtraInput[];
}

export interface UpdateCateringOrderInput {
  templateId?: string | null;
  packageId?: string | null;
  status?: CateringOrderStatus;
  deliveryType?: CateringDeliveryType;
  eventName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  guestsCount?: number;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  discountType?: CateringDiscountType | null;
  discountValue?: number | null;
  discountReason?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  specialRequirements?: string | null;
  quoteExpiresAt?: string | null;
  items?: CreateOrderItemInput[];
  extras?: CreateOrderExtraInput[];
  changedById?: string;
  changeReason?: string | null;
}

export interface ListOrdersFilter {
  status?: CateringOrderStatus;
  deliveryType?: CateringDeliveryType;
  clientId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Pobierz nazwy dań (snapshot) ────────────────────────────────────────────────

async function resolveDishNames(
  items: CreateOrderItemInput[],
): Promise<Array<CreateOrderItemInput & { dishNameSnapshot: string }>> {
  if (items.length === 0) return [];
  const dishIds = [...new Set(items.map(i => i.dishId))];
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(dishes.map(d => [d.id, d.name]));
  return items.map(i => ({
    ...i,
    dishNameSnapshot: nameMap.get(i.dishId) ?? i.dishId,
  }));
}

// ─── Pomocnicze: przelicz sumy ───────────────────────────────────────────────────

function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  extras: { quantity: number; unitPrice: number }[],
  discountType?: CateringDiscountType | null,
  discountValue?: number | null,
): { subtotal: number; extrasTotalPrice: number; discountAmount: number; totalPrice: number } {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const extrasTotalPrice = extras.reduce((s, e) => s + e.quantity * e.unitPrice, 0);
  const gross = subtotal + extrasTotalPrice;

  let discountAmount = 0;
  if (discountType && discountValue != null && discountValue > 0) {
    if (discountType === 'PERCENTAGE') {
      discountAmount = Math.round(gross * (discountValue / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discountValue, gross);
    }
  }

  return {
    subtotal,
    extrasTotalPrice,
    discountAmount,
    totalPrice: Math.max(0, gross - discountAmount),
  };
}

// ─── Pomocnicze: rzuć 400 ────────────────────────────────────────────────────

function badRequest(message: string): never {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = 400;
  throw err;
}

// ─── Include (wspólny dla get/create/update) ─────────────────────────────────────────────────────────

const orderInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyName: true,
      clientType: true,
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  template: { select: { id: true, name: true, slug: true } },
  package: { select: { id: true, name: true, basePrice: true } },
  items: {
    include: { dish: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  extras: {
    include: { serviceItem: { select: { id: true, name: true, icon: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  deposits: { orderBy: { dueDate: 'asc' as const } },
} satisfies Prisma.CateringOrderInclude;

// ─── Serwis ────────────────────────────────────────────────────────────────────────────────────

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

export async function changeOrderStatus(
  id: string,
  status: CateringOrderStatus,
  changedById: string,
  reason?: string | null,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  return updateOrder(id, { status, changedById, changeReason: reason });
}

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

export async function getOrderHistory(orderId: string) {
  return prisma.cateringOrderHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: {
      changedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ─── Depozyty ────────────────────────────────────────────────────────────────────────────────────

export interface CreateDepositInput {
  amount: number;
  dueDate: string;
  title?: string | null;
  description?: string | null;
  internalNotes?: string | null;
}

export interface UpdateDepositInput {
  amount?: number;
  dueDate?: string;
  title?: string | null;
  description?: string | null;
  internalNotes?: string | null;
}

export async function createDeposit(
  orderId: string,
  input: CreateDepositInput,
  changedById?: string,
) {
  if (input.amount <= 0) {
    badRequest('Kwota zaliczki musi być większa od 0.');
  }

  // Walidacja: suma zaliczek nie może przekroczyć wartości zamówienia
  const order = await prisma.cateringOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { deposits: true },
  });

  const existingTotal = order.deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPrice = Number(order.totalPrice);
  const newTotal = existingTotal + input.amount;

  if (newTotal > totalPrice) {
    const remaining = Math.max(0, totalPrice - existingTotal);
    badRequest(
      `Suma zaliczek (${newTotal.toFixed(2)} PLN) przekracza wartość zamówienia (${totalPrice.toFixed(2)} PLN). Możesz dodać maksymalnie ${remaining.toFixed(2)} PLN.`,
    );
  }

  const deposit = await prisma.cateringDeposit.create({
    data: {
      orderId,
      amount: input.amount,
      remainingAmount: input.amount,
      dueDate: input.dueDate,
      title: input.title ?? null,
      description: input.description ?? null,
      internalNotes: input.internalNotes ?? null,
    },
  });

  if (changedById) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_CREATED',
        fieldName: 'deposit',
        newValue: `${input.title ?? 'Zaliczka'} — ${input.amount} PLN`,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_CREATED
  }

  return deposit;
}

export async function updateDeposit(
  depositId: string,
  input: UpdateDepositInput,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({ where: { id: depositId } });

  // Walidacja kwoty: suma pozostałych zaliczek + nowa kwota ≤ totalPrice
  if (input.amount !== undefined) {
    if (input.amount <= 0) {
      badRequest('Kwota zaliczki musi być większa od 0.');
    }

    const order = await prisma.cateringOrder.findUniqueOrThrow({
      where: { id: deposit.orderId },
      include: { deposits: true },
    });

    const otherTotal = order.deposits
      .filter(d => d.id !== depositId)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalPrice = Number(order.totalPrice);
    const newTotal = otherTotal + input.amount;

    if (newTotal > totalPrice) {
      const maxAllowed = Math.max(0, totalPrice - otherTotal);
      badRequest(
        `Suma zaliczek (${newTotal.toFixed(2)} PLN) przekracza wartość zamówienia (${totalPrice.toFixed(2)} PLN). Maksymalna kwota tej zaliczki to ${maxAllowed.toFixed(2)} PLN.`,
      );
    }
  }

  const updated = await prisma.cateringDeposit.update({
    where: { id: depositId },
    data: {
      ...(input.amount !== undefined && {
        amount: input.amount,
        remainingAmount: deposit.paid ? 0 : input.amount,
      }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...('title' in input && { title: input.title ?? null }),
      ...('description' in input && { description: input.description ?? null }),
      ...('internalNotes' in input && { internalNotes: input.internalNotes ?? null }),
    },
  });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_UPDATED',
        fieldName: 'deposit',
        newValue: `${updated.title ?? 'Zaliczka'} — ${updated.amount} PLN`,
      },
    });
  }

  return updated;
}

export async function deleteDeposit(
  depositId: string,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({ where: { id: depositId } });

  // Usuwanie opłaconych zaliczek jest dozwolone (korekta błędu, rezygnacja klienta).
  // Operacja rejestrowana jest w logu audytowym z flagą wasPaid.
  const wasPaid = deposit.paid;

  await prisma.cateringDeposit.delete({ where: { id: depositId } });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_DELETED',
        fieldName: 'deposit',
        oldValue: `${deposit.title ?? 'Zaliczka'} — ${deposit.amount} PLN`,
        newValue: wasPaid ? `wasPaid:true paymentMethod:${deposit.paymentMethod ?? 'N/A'}` : null,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_DELETED
  }
}

export async function markDepositPaid(
  depositId: string,
  paymentMethod?: string,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({
    where: { id: depositId },
  });

  const result = await prisma.cateringDeposit.update({
    where: { id: depositId },
    data: {
      paid: true,
      paidAt: new Date(),
      paidAmount: deposit.amount,
      remainingAmount: 0,
      status: 'PAID',
      paymentMethod: paymentMethod ?? null,
    },
  });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_PAID',
        fieldName: 'deposit',
        newValue: `${deposit.title ?? 'Zaliczka'} — ${deposit.amount} PLN (${paymentMethod ?? 'bez metody'})`,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_PAID
  }

  return result;
}

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
