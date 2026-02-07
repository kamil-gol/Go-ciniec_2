import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async markAsPaid(
    depositId: string,
    paymentMethod: 'CASH' | 'TRANSFER' | 'BLIK',
    paidAt: string,
  ) {
    // Check if deposit exists
    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${depositId} not found`);
    }

    // Update deposit as paid
    return this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        paid: true,
        status: 'PAID',
        paidAt: new Date(paidAt),
        paymentMethod: paymentMethod,
      },
    });
  }

  async markAsUnpaid(depositId: string) {
    // Check if deposit exists
    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${depositId} not found`);
    }

    // Update deposit as unpaid
    return this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        paid: false,
        status: 'PENDING',
        paidAt: null,
        paymentMethod: null,
      },
    });
  }
}
