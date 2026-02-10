/**
 * Reservation Menu Module
 * 
 * Handles menu selection and pricing for reservations
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MenuCalculatorService } from './services/menu-calculator.service';
import { MenuCalculatorController } from './controllers/menu-calculator.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MenuCalculatorController],
  providers: [MenuCalculatorService],
  exports: [MenuCalculatorService],
})
export class ReservationMenuModule {}
