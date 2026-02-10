import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Dish } from '@prisma/client';

export interface DishFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateDishDto {
  name: string;
  description?: string | null;
  category: string;
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
  async findAll(filters?: DishFilters): Promise<Dish[]> {
    const where: Prisma.DishWhereInput = {};

    if (filters?.category) {
      where.category = filters.category;
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
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get single dish by ID
   */
  async findOne(id: string): Promise<Dish> {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
    });

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }

    return dish;
  }

  /**
   * Get dishes by category
   */
  async findByCategory(category: string): Promise<Dish[]> {
    return this.prisma.dish.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create new dish
   */
  async create(data: CreateDishDto): Promise<Dish> {
    // Check if dish with same name already exists
    const existing = await this.prisma.dish.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Dish with name "${data.name}" already exists`);
    }

    return this.prisma.dish.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        allergens: data.allergens || [],
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update existing dish
   */
  async update(id: string, data: UpdateDishDto): Promise<Dish> {
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

    return this.prisma.dish.update({
      where: { id },
      data,
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
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const result = await this.prisma.dish.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    return result.map(item => ({
      category: item.category,
      count: item._count.category,
    }));
  }
}
