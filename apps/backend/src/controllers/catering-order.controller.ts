import { Request, Response, NextFunction } from 'express';
import cateringOrderService from '@/services/catering-order.service';
import { CateringOrderStatus, CateringDeliveryType } from '@/generated/prisma';

function getUserId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}

// ─── Lista zamówień ──────────────────────────────────────────────────────────────────────────

async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status, deliveryType, clientId, eventDateFrom, eventDateTo, search, page, limit } =
      req.query as Record<string, string | undefined>;

    const result = await cateringOrderService.listOrders({
      status: status as CateringOrderStatus | undefined,
      deliveryType: deliveryType as CateringDeliveryType | undefined,
      clientId,
      eventDateFrom,
      eventDateTo,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ─── Szczegóły zamówienia ──────────────────────────────────────────────────────────────────

async function getOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await cateringOrderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Zamówienie nie istnieje' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Utwórz ──────────────────────────────────────────────────────────────────────

async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await cateringOrderService.createOrder({
      ...req.body,
      createdById: getUserId(req),
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Aktualizuj ──────────────────────────────────────────────────────────────────────

async function updateOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await cateringOrderService.updateOrder(req.params.id, {
      ...req.body,
      changedById: getUserId(req),
    });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Zmień status ─────────────────────────────────────────────────────────────────────

async function changeStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status, reason } = req.body as { status: CateringOrderStatus; reason?: string };
    const order = await cateringOrderService.changeOrderStatus(
      req.params.id,
      status,
      getUserId(req),
      reason,
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Usuń ──────────────────────────────────────────────────────────────────────

async function deleteOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await cateringOrderService.deleteOrder(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Historia (timeline) ──────────────────────────────────────────────────────────────────

async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const history = await cateringOrderService.getOrderHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

// ─── Depozyty ───────────────────────────────────────────────────────────────────────

async function createDeposit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposit = await cateringOrderService.createDeposit(
      req.params.id,
      req.body,
      getUserId(req),
    );
    res.status(201).json({ success: true, data: deposit });
  } catch (err) {
    next(err);
  }
}

async function updateDeposit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposit = await cateringOrderService.updateDeposit(
      req.params.depositId,
      req.body,
      getUserId(req),
      req.params.id,
    );
    res.json({ success: true, data: deposit });
  } catch (err) {
    next(err);
  }
}

async function deleteDeposit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await cateringOrderService.deleteDeposit(
      req.params.depositId,
      getUserId(req),
      req.params.id,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function markDepositPaid(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { paymentMethod } = req.body as { paymentMethod?: string };
    const deposit = await cateringOrderService.markDepositPaid(
      req.params.depositId,
      paymentMethod,
      getUserId(req),
      req.params.id,
    );
    res.json({ success: true, data: deposit });
  } catch (err) {
    next(err);
  }
  }

  // ─── PDF ────────────────────────────────────────────────────────────────────

async function generatePDF(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { type } = req.params as { type: string };
    const order = await cateringOrderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Zamówienie nie istnieje' });
      return;
    }

    const { pdfService } = await import('@/services/pdf.service');
    let buffer: Buffer;
    let filename: string;

    if (type === 'quote') {
      buffer = await pdfService.generateCateringQuotePDF(order as any);
      filename = `wycena-catering-${order.orderNumber}.pdf`;
    } else if (type === 'kitchen') {
      buffer = await pdfService.generateCateringKitchenPDF(order as any);
      filename = `druk-kuchenny-${order.orderNumber}.pdf`;
    } else if (type === 'invoice') {
      buffer = await pdfService.generateCateringInvoicePDF(order as any);
      filename = `faktura-catering-${order.orderNumber}.pdf`;
        } else if (type === 'order') {
    buffer = await pdfService.generateCateringOrderPDF(order as any);
    filename = `zamowienie-catering-${order.orderNumber}.pdf`;
    } else {
      res.status(400).json({ success: false, error: 'Nieprawidłowy typ dokumentu. Dozwolone: quote, kitchen, invoice, order' });      return;
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

  export {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  changeStatus,
      deleteOrder,
  createDeposit,
  updateDeposit,
  deleteDeposit,
      getHistory,
  markDepositPaid,
  generatePDF,
};
