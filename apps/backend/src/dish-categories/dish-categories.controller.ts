import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DishCategoriesService, CreateDishCategoryDto, UpdateDishCategoryDto } from './dish-categories.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('dish-categories')
export class DishCategoriesController {
  constructor(private readonly dishCategoriesService: DishCategoriesService) {}

  /**
   * GET /dish-categories
   * Get all categories (public)
   */
  @Get()
  async findAll() {
    return this.dishCategoriesService.findAll();
  }

  /**
   * GET /dish-categories/:id
   * Get single category (public)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dishCategoriesService.findOne(id);
  }

  /**
   * GET /dish-categories/slug/:slug
   * Get category by slug (public)
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.dishCategoriesService.findBySlug(slug);
  }

  /**
   * POST /dish-categories
   * Create new category (protected)
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() data: CreateDishCategoryDto) {
    return this.dishCategoriesService.create(data);
  }

  /**
   * PUT /dish-categories/:id
   * Update category (protected)
   */
  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() data: UpdateDishCategoryDto) {
    return this.dishCategoriesService.update(id, data);
  }

  /**
   * DELETE /dish-categories/:id
   * Delete category (protected)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.dishCategoriesService.remove(id);
  }

  /**
   * POST /dish-categories/reorder
   * Reorder categories (protected)
   */
  @Post('reorder')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(@Body() data: { ids: string[] }) {
    await this.dishCategoriesService.reorder(data.ids);
  }
}
