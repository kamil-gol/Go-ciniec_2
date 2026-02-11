import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Dish, DishCategory } from '@prisma/client';

export type DishWithCategory = Dish & { category: DishCategory };

export interface DishFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateDishDto {
  name: string;
  description?: string | null;
  categoryId: string;
  allergens?: string[];
  isActive?: boolean;
}

export interface UpdateDishDto extends Partial<CreateDishDto> {}

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all dishes with optional filters
   */
  async findAll(filters?: DishFilters): Promise<DishWithCategory[]> {
    const where: Prisma.DishWhereInput = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.dish.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get single dish by ID
   */
  async findOne(id: string): Promise<DishWithCategory> {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }

    return dish;
  }

  /**
   * Get dishes by category ID
   */
  async findByCategory(categoryId: string): Promise<DishWithCategory[]> {
    return this.prisma.dish.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create new dish
   */
  async create(data: CreateDishDto): Promise<DishWithCategory> {
    // Check if dish with same name already exists
    const existing = await this.prisma.dish.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Dish with name "${data.name}" already exists`);
    }

    // Verify category exists
    const category = await this.prisma.dishCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
    }

    return this.prisma.dish.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        allergens: data.allergens || [],
        isActive: data.isActive ?? true,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update existing dish
   */
  async update(id: string, data: UpdateDishDto): Promise<DishWithCategory> {
    // Check if dish exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (data.name) {
      const existing = await this.prisma.dish.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Dish with name "${data.name}" already exists`);
      }
    }

    // If updating categoryId, verify it exists
    if (data.categoryId) {
      const category = await this.prisma.dishCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }
    }

    return this.prisma.dish.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  /**
   * Delete dish
   */
  async remove(id: string): Promise<void> {
    // Check if dish exists
    await this.findOne(id);

    await this.prisma.dish.delete({
      where: { id },
    });
  }

  /**
   * Get dish categories with counts
   */
  async getCategories(): Promise<Array<DishCategory & { _count: { dishes: number } }>> {
    return this.prisma.dishCategory.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
