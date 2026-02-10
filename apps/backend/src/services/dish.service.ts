/**
 * Dish Service
 * 
 * Handles all business logic for dish library operations
 */

import { PrismaClient, Prisma, DishCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateDishInput {
  name: string;
  description?: string;
  category: DishCategory;
  allergens?: string[];
  priceModifier?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateDishInput {
  name?: string;
  description?: string;
  category?: DishCategory;
  allergens?: string[];
  priceModifier?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface DishFilters {
  category?: DishCategory;
  isActive?: boolean;
  search?: string;
}

export class DishService {
  
  /**
   * List all dishes with optional filters
   */
  async list(filters?: DishFilters) {
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
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return await prisma.dish.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Get single dish by ID
   */
  async getById(id: string) {
    const dish = await prisma.dish.findUnique({
      where: { id }
    });

    if (!dish) {
      throw new Error('Dish not found');
    }

    return dish;
  }

  /**
   * Create new dish
   */
  async create(data: CreateDishInput) {
    return await prisma.dish.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        allergens: data.allergens ?? [],
        priceModifier: data.priceModifier ?? 0,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0
      }
    });
  }

  /**
   * Update dish
   */
  async update(id: string, data: UpdateDishInput) {
    // Check if dish exists
    await this.getById(id);

    return await prisma.dish.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        allergens: data.allergens,
        priceModifier: data.priceModifier,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        isActive: data.isActive,
        displayOrder: data.displayOrder
      }
    });
  }

  /**
   * Delete dish
   */
  async delete(id: string) {
    // Check if dish exists
    await this.getById(id);

    // Check if dish is used in any courses
    const usageCount = await prisma.menuCourseOption.count({
      where: { dishId: id }
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete dish. It is used in ${usageCount} course(s).`);
    }

    return await prisma.dish.delete({
      where: { id }
    });
  }

  /**
   * Get dishes by category
   */
  async getByCategory(category: DishCategory) {
    return await prisma.dish.findMany({
      where: {
        category,
        isActive: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Get dishes by IDs (for bulk operations)
   */
  async getByIds(ids: string[]) {
    return await prisma.dish.findMany({
      where: {
        id: { in: ids }
      }
    });
  }
}

export const dishService = new DishService();
