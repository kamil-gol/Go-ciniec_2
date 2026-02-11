import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DishesService, CreateDishDto, UpdateDishDto, DishFilters } from './dishes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dishes')
@UseGuards(JwtAuthGuard)
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  /**
   * GET /dishes
   * Get all dishes with optional filters
   */
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: DishFilters = {};

    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const dishes = await this.dishesService.findAll(filters);

    return {
      success: true,
      data: dishes,
    };
  }

  /**
   * GET /dishes/:id
   * Get single dish by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const dish = await this.dishesService.findOne(id);

    return {
      success: true,
      data: dish,
    };
  }

  /**
   * GET /dishes/category/:category
   * Get dishes by category
   */
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const dishes = await this.dishesService.findByCategory(category);

    return {
      success: true,
      data: dishes,
    };
  }

  /**
   * POST /dishes
   * Create new dish
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDishDto: CreateDishDto) {
    const dish = await this.dishesService.create(createDishDto);

    return {
      success: true,
      data: dish,
      message: 'Dish created successfully',
    };
  }

  /**
   * PUT /dishes/:id
   * Update existing dish
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDishDto: UpdateDishDto,
  ) {
    const dish = await this.dishesService.update(id, updateDishDto);

    return {
      success: true,
      data: dish,
      message: 'Dish updated successfully',
    };
  }

  /**
   * DELETE /dishes/:id
   * Delete dish
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.dishesService.remove(id);

    return {
      success: true,
      message: 'Dish deleted successfully',
    };
  }

  /**
   * GET /dishes/stats/categories
   * Get dish categories with counts
   */
  @Get('stats/categories')
  async getCategories() {
    const categories = await this.dishesService.getCategories();

    return {
      success: true,
      data: categories,
    };
  }
}
