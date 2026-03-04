import prisma from '@lib/prisma';
import {
  CateringOrderStatus,
  CateringDeliveryType,
  CateringDiscountType,
  Prisma,
} from '@prisma/client';

// ─── Auto-numeracja: CAT-YYYY-XXXXX ─────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Liczymy istniejące zamówienia z bieżącego roku
  const count = await prisma.cateringOrder.count({
    where: { orderNumber: { startsWith: `CAT-${year}-` } },
  });
  const seq = String(count + 1).padStart(5, '0');
  return `CAT-${year}-${seq}`;
}

// ─── Typy wejściowe ──────────────────────────────────────────────────────────

export interface CreateOrderItemInput {
  dishId: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface CreateOrderExtraInput {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateCateringOrderInput {
  clientId: string;
  createdById: string;
  templateId?: string;
  packageId?: string;
  deliveryType?: CateringDeliveryType;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  guestsCount?: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  discountType?: CateringDiscountType;
  discountValue?: number;
  discountReason?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  internalNotes?: string;
  specialRequirements?: string;
  quoteExpiresAt?: string;
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
  changeReason?: string;
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

// ─── Pomocnicze: przelicz sumy ───────────────────────────────────────────────

function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  extras: { quantity: number; unitPrice: number }[],
  discountType?: CateringDiscountType | null,
  discountValue?: number | null,
): {
  subtotal: number;
  extrasTotalPrice: number;
  discountAmount: number;
  totalPrice: number;
} {
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

// ─── Serwis ──────────────────────────────────────────────────────────────────

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
  extras: { orderBy: { createdAt: 'asc' as const } },
  deposits: { orderBy: { dueDate: 'asc' as const } },
} satisfies Prisma.CateringOrderInclude;

export async function createOrder(
  input: CreateCateringOrderInput,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  const orderNumber = await generateOrderNumber();

  const items = input.items ?? [];
  const extras = input.extras ?? [];
  const totals = computeTotals(
    items,
    extras,
    input.discountType,
    input.discountValue,
  );

  return prisma.cateringOrder.create({
    data: {
      orderNumber,
      clientId: input.clientId,
      createdById: input.createdById,
      templateId: input.templateId,
      packageId: input.packageId,
      deliveryType: input.deliveryType ?? 'ON_SITE',
      eventName: input.eventName,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      eventLocation: input.eventLocation,
      guestsCount: input.guestsCount ?? 0,
      deliveryAddress: input.deliveryAddress,
      deliveryNotes: input.deliveryNotes,
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime,
      subtotal: totals.subtotal,
      extrasTotalPrice: totals.extrasTotalPrice,
      discountType: input.discountType,
      discountValue: input.discountValue,
      discountAmount: totals.discountAmount,
      discountReason: input.discountReason,
      totalPrice: totals.totalPrice,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      notes: input.notes,
      internalNotes: input.internalNotes,
      specialRequirements: input.specialRequirements,
      quoteExpiresAt: input.quoteExpiresAt ? new Date(input.quoteExpiresAt) : undefined,
      items: {
        create: items.map(i => ({
          dishId: i.dishId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
          note: i.note,
          dishNameSnapshot: '',  // uzupełniamy poniżej
        })),
      },
      extras: {
        create: extras.map(e => ({
          name: e.name,
          description: e.description,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          totalPrice: e.quantity * e.unitPrice,
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
    if (filter.eventDateFrom) (where.eventDate as Prisma.StringFilter).gte = filter.eventDateFrom;
    if (filter.eventDateTo) (where.eventDate as Prisma.StringFilter).lte = filter.eventDateTo;
  }

  if (filter.search) {
    const search = filter.search;
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { eventName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { client: { firstName: { contains: search, mode: 'insensitive' } } },
      { client: { lastName: { contains: search, mode: 'insensitive' } } },
      { client: { companyName: { contains: search, mode: 'insensitive' } } },
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
        _count: {
          select: { items: true, deposits: true },
        },
      },
    }),
    prisma.cateringOrder.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateOrder(
  id: string,
  input: UpdateCateringOrderInput,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  const existing = await prisma.cateringOrder.findUniqueOrThrow({ where: { id } });

  const oldStatus = existing.status;

  // Jeśli przekazano nowe items/extras — usuń stare i przelicz
  let subtotalData: {
    subtotal: number;
    extrasTotalPrice: number;
    discountAmount: number;
    totalPrice: number;
  } | null = null;

  const updateData: Prisma.CateringOrderUpdateInput = {};

  if (input.items !== undefined || input.extras !== undefined) {
    const items = input.items ?? [];
    const extras = input.extras ?? [];
    subtotalData = computeTotals(
      items,
      extras,
      input.discountType !== undefined
        ? input.discountType
        : (existing.discountType as CateringDiscountType | null),
      input.discountValue !== undefined ? input.discountValue : Number(existing.discountValue),
    );
    updateData.subtotal = subtotalData.subtotal;
    updateData.extrasTotalPrice = subtotalData.extrasTotalPrice;
    updateData.discountAmount = subtotalData.discountAmount;
    updateData.totalPrice = subtotalData.totalPrice;

    if (input.items !== undefined) {
      updateData.items = {
        deleteMany: {},
        create: input.items.map(i => ({
          dishId: i.dishId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
          note: i.note,
          dishNameSnapshot: '',
        })),
      };
    }
    if (input.extras !== undefined) {
      updateData.extras = {
        deleteMany: {},
        create: input.extras.map(e => ({
          name: e.name,
          description: e.description,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          totalPrice: e.quantity * e.unitPrice,
        })),
      };
    }
  } else if (
    input.discountType !== undefined ||
    input.discountValue !== undefined
  ) {
    // Tylko rabat zmieniony — przelicz na podstawie istniejących sum
    const currentSubtotal = Number(existing.subtotal);
    const currentExtras = Number(existing.extrasTotalPrice);
    const disc = computeTotals(
      [{ quantity: 1, unitPrice: currentSubtotal }],
      [{ quantity: 1, unitPrice: currentExtras }],
      input.discountType !== undefined
        ? input.discountType
        : (existing.discountType as CateringDiscountType | null),
      input.discountValue !== undefined ? input.discountValue : Number(existing.discountValue),
    );
    updateData.discountAmount = disc.discountAmount;
    updateData.totalPrice = disc.totalPrice;
  }

  // Skalarne pola
  if (input.status !== undefined) updateData.status = input.status;
  if (input.deliveryType !== undefined) updateData.deliveryType = input.deliveryType;
  if ('templateId' in input) updateData.templateId = input.templateId ?? null;
  if ('packageId' in input) updateData.packageId = input.packageId ?? null;
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

  // Historia zmian statusu
  if (input.status !== undefined && input.status !== oldStatus) {
    updateData.history = {
      create: {
        changedById: input.changedById ?? existing.createdById,
        changeType: 'STATUS_CHANGE',
        fieldName: 'status',
        oldValue: oldStatus,
        newValue: input.status,
        reason: input.changeReason,
      },
    };
  }

  return prisma.cateringOrder.update({
    where: { id },
    data: updateData,
    include: orderInclude,
  });
}

export async function changeOrderStatus(
  id: string,
  status: CateringOrderStatus,
  changedById: string,
  reason?: string,
): Promise<Prisma.CateringOrderGetPayload<{ include: typeof orderInclude }>> {
  return updateOrder(id, { status, changedById, changeReason: reason });
}

export async function deleteOrder(id: string): Promise<void> {
  const order = await prisma.cateringOrder.findUniqueOrThrow({ where: { id } });
  if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
    throw Object.assign(new Error('Można usunąć tylko zamówienia w statusie DRAFT lub CANCELLED'), {
      statusCode: 400,
    });
  }
  await prisma.cateringOrder.delete({ where: { id } });
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

// ─── Depozyty ────────────────────────────────────────────────────────────────

export interface CreateDepositInput {
  amount: number;
  dueDate: string;
  title?: string;
  description?: string;
  internalNotes?: string;
}

export async function createDeposit(orderId: string, input: CreateDepositInput) {
  return prisma.cateringDeposit.create({
    data: {
      orderId,
      amount: input.amount,
      remainingAmount: input.amount,
      dueDate: input.dueDate,
      title: input.title,
      description: input.description,
      internalNotes: input.internalNotes,
    },
  });
}

export async function markDepositPaid(
  depositId: string,
  paymentMethod?: string,
) {
  return prisma.cateringDeposit.update({
    where: { id: depositId },
    data: {
      paid: true,
      paidAt: new Date(),
      paidAmount: prisma.cateringDeposit
        .findUniqueOrThrow({ where: { id: depositId } })
        .then(d => Number(d.amount)) as unknown as number,
      remainingAmount: 0,
      status: 'PAID',
      paymentMethod,
    },
  });
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
  markDepositPaid,
};
