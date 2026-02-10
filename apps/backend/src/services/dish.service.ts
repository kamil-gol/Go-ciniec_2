/**
 * Dish Service
 * Business logic for dish management
 */

import { PrismaClient, Dish, DishCategory } from '@prisma/client';

const prisma = new PrismaClient();

export type DishWithCategory = Dish & { category: DishCategory };

export interface DishFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateDishInput {
  name: string;
  description?: string | null;
  categoryId: string;
  allergens?: string[];
  isActive?: boolean;
}

export interface UpdateDishInput extends Partial<CreateDishInput> {}

class DishService {
  /**
   * Get all dishes with optional filters
   */
  async findAll(filters?: DishFilters): Promise<DishWithCategory[]> {
    const where: any = {};

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

    return prisma.dish.findMany({
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
  async findOne(id: string): Promise<DishWithCategory | null> {
    return prisma.dish.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  /**
   * Get dishes by category ID
   */
  async findByCategory(categoryId: string): Promise<DishWithCategory[]> {
    return prisma.dish.findMany({
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
  async create(data: CreateDishInput): Promise<DishWithCategory> {
    // Check if dish with same name already exists
    const existing = await prisma.dish.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error(`Dish with name "${data.name}" already exists`);
    }

    // Verify category exists
    const category = await prisma.dishCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error(`Category with ID ${data.categoryId} not found`);
    }

    return prisma.dish.create({
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
  async update(id: string, data: UpdateDishInput): Promise<DishWithCategory> {
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

    // If updating categoryId, verify it exists
    if (data.categoryId) {
      const category = await prisma.dishCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error(`Category with ID ${data.categoryId} not found`);
      }
    }

    return prisma.dish.update({
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
