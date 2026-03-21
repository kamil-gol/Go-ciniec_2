/**
 * Dish Service
 * Business logic for dish management
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { Dish, DishCategory } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
import { DISH } from '../i18n/pl';

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
  async findAll(filters?: DishFilters): Promise<DishWithCategory[]> {
    const where: any = {};

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.dish.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string): Promise<DishWithCategory | null> {
    return prisma.dish.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async getByIds(ids: string[]): Promise<DishWithCategory[]> {
    return prisma.dish.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    });
  }

  async findByCategory(categoryId: string): Promise<DishWithCategory[]> {
    return prisma.dish.findMany({
      where: { categoryId },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateDishInput, userId: string): Promise<DishWithCategory> {
    const existing = await prisma.dish.findFirst({ where: { name: data.name } });
    if (existing) throw new Error(`Danie o nazwie "${data.name}" już istnieje`);

    const category = await prisma.dishCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error(`Nie znaleziono kategorii o ID ${data.categoryId}`);

    const dish = await prisma.dish.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        allergens: data.allergens || [],
        isActive: data.isActive ?? true,
      },
      include: { category: true },
    });

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'DISH',
      entityId: dish.id,
      details: {
        description: `Utworzono danie: ${dish.name}`,
        data: {
          name: dish.name,
          categoryId: dish.categoryId,
          categoryName: category.name,
          allergens: dish.allergens
        }
      }
    });

    return dish;
  }

  async update(id: string, data: UpdateDishInput, userId: string): Promise<DishWithCategory> {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(DISH.NOT_FOUND);

    if (data.name) {
      const nameConflict = await prisma.dish.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (nameConflict) throw new Error(`Danie o nazwie "${data.name}" już istnieje`);
    }

    if (data.categoryId) {
      const category = await prisma.dishCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new Error(`Nie znaleziono kategorii o ID ${data.categoryId}`);
    }

    const dish = await prisma.dish.update({
      where: { id },
      data,
      include: { category: true },
    });

    // Audit log
    const changes = diffObjects(existing, dish);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'DISH',
        entityId: dish.id,
        details: {
          description: `Zaktualizowano danie: ${dish.name}`,
          changes
        }
      });
    }

    return dish;
  }

  async toggleActive(id: string, userId: string): Promise<DishWithCategory> {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(DISH.NOT_FOUND);

    const dish = await prisma.dish.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: { category: true },
    });

    // Audit log
    await logChange({
      userId,
      action: 'TOGGLE_ACTIVE',
      entityType: 'DISH',
      entityId: dish.id,
      details: {
        description: `${dish.isActive ? 'Aktywowano' : 'Dezaktywowano'} danie: ${dish.name}`,
        oldValue: existing.isActive,
        newValue: dish.isActive
      }
    });

    return dish;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(DISH.NOT_FOUND);

    await prisma.dish.delete({ where: { id } });

    // Audit log
    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'DISH',
      entityId: id,
      details: {
        description: `Usunięto danie: ${existing.name}`,
        deletedData: {
          name: existing.name,
          categoryName: existing.category.name
        }
      }
    });
  }
}

const dishServiceInstance = new DishService();
export default dishServiceInstance;
export { dishServiceInstance as dishService };
