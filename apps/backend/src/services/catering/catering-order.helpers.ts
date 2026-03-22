import prisma from '@lib/prisma';
import { CateringDiscountType, Prisma } from '@/prisma-client';
import type { CreateOrderItemInput } from './catering-order.types';

// ─── Auto-numeracja: CAT-YYYY-XXXXX ────────────────────────────────────────

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.cateringOrder.count({
    where: { orderNumber: { startsWith: `CAT-${year}-` } },
  });
  const seq = String(count + 1).padStart(5, '0');
  return `CAT-${year}-${seq}`;
}

// ─── Pobierz nazwy dań (snapshot) ────────────────────────────────────────────────

export async function resolveDishNames(
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

export function computeTotals(
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

export function badRequest(message: string): never {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = 400;
  throw err;
}

// ─── Include (wspólny dla get/create/update) ─────────────────────────────────────────────────────────

export const orderInclude = {
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
