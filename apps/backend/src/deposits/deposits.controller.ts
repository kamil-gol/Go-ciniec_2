import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositsService } from './deposits.service';

export class MarkDepositPaidDto {
  paymentMethod: 'CASH' | 'TRANSFER' | 'BLIK';
  paidAt: string; // ISO date string
}

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Patch(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(
    @Param('id') id: string,
    @Body() body: MarkDepositPaidDto,
  ) {
    return this.depositsService.markAsPaid(id, body.paymentMethod, body.paidAt);
  }

  @Patch(':id/mark-unpaid')
  @HttpCode(HttpStatus.OK)
  async markAsUnpaid(@Param('id') id: string) {
    return this.depositsService.markAsUnpaid(id);
  }
}
