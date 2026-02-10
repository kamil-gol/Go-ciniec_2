/**
 * Menu Calculator Controller
 * 
 * API endpoints for menu price calculation
 */

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MenuCalculatorService } from '../services/menu-calculator.service';
import {
  MenuCalculatorRequestDto,
  MenuCalculatorResponseDto,
} from '../dto/menu-calculator.dto';

@ApiTags('Menu Calculator')
@Controller('menu-calculator')
export class MenuCalculatorController {
  constructor(private readonly calculatorService: MenuCalculatorService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate menu price' })
  @ApiResponse({
    status: 200,
    description: 'Price calculated successfully',
    type: MenuCalculatorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async calculatePrice(
    @Body() dto: MenuCalculatorRequestDto,
  ): Promise<MenuCalculatorResponseDto> {
    return this.calculatorService.calculateMenuPrice(dto);
  }

  @Get('packages/available')
  @ApiOperation({ summary: 'Get available packages for event type and date' })
  @ApiResponse({
    status: 200,
    description: 'Available packages retrieved',
  })
  async getAvailablePackages(
    @Query('eventTypeId') eventTypeId: string,
    @Query('date') date?: string,
  ) {
    const parsedDate = date ? new Date(date) : undefined;
    return this.calculatorService.getAvailablePackages(eventTypeId, parsedDate);
  }

  @Get('option/:optionId/calculate')
  @ApiOperation({ summary: 'Calculate price for a single option' })
  @ApiResponse({
    status: 200,
    description: 'Option price calculated',
  })
  @ApiResponse({ status: 404, description: 'Option not found' })
  async calculateOptionPrice(
    @Param('optionId') optionId: string,
    @Query('adults') adults: string,
    @Query('children') children: string = '0',
    @Query('toddlers') toddlers: string = '0',
    @Query('quantity') quantity: string = '1',
  ) {
    const guests = {
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      toddlers: parseInt(toddlers, 10),
    };

    const calculatedPrice = await this.calculatorService.calculateOptionPrice(
      optionId,
      guests,
      parseInt(quantity, 10),
    );

    return {
      optionId,
      guests,
      quantity: parseInt(quantity, 10),
      calculatedPrice,
    };
  }
}
