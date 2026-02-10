/**
 * Dish Service
 * Business logic for dish management
 */

import { PrismaClient, Dish } from '@prisma/client';

const prisma = new PrismaClient();

export interface DishFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateDishInput {
  name: string;
  description?: string | null;
  category: string;
  allergens?: string[];
  isActive?: boolean;
}

export interface UpdateDishInput extends Partial<CreateDishInput> {}

class DishService {
  /**
   * Get all dishes with optional filters
   */
  async findAll(filters?: DishFilters): Promise<Dish[]> {
    const where: any = {};

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

    return prisma.dish.findMany({
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
  async findOne(id: string): Promise<Dish | null> {
    return prisma.dish.findUnique({
      where: { id },
    });
  }

  /**
   * Get dishes by category
   */
  async findByCategory(category: string): Promise<Dish[]> {
    return prisma.dish.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create new dish
   */
  async create(data: CreateDishInput): Promise<Dish> {
    // Check if dish with same name already exists
    const existing = await prisma.dish.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error(`Dish with name "${data.name}" already exists`);
    }

    return prisma.dish.create({
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
  async update(id: string, data: UpdateDishInput): Promise<Dish> {
    // Check if dish exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new Error(`Dish with ID ${id} not found`);
    }

    // If updating name, check for conflicts
    if (data.name) {
      const nameConflict = await prisma.dish.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (nameConflict) {
        throw new Error(`Dish with name "${data.name}" already exists`);
      }
    }

    return prisma.dish.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete dish
   */
  async remove(id: string): Promise<void> {
    // Check if dish exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new Error(`Dish with ID ${id} not found`);
    }

    await prisma.dish.delete({
      where: { id },
    });
  }
}

export default new DishService();
