/**
 * Addon Group Service
 * Business logic for managing addon groups and their dishes
 * 🇵🇱 Spolonizowany — komunikaty po polsku
 */

import { prisma } from '@/lib/prisma';

export interface CreateAddonGroupInput {
  name: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  priceType: string;
  basePrice?: number;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateAddonGroupInput {
  name?: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  priceType?: string;
  basePrice?: number;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface AssignDishesToGroupInput {
  dishes: Array<{
    dishId: string;
    customPrice?: number | null;
    displayOrder?: number;
  }>;
}

class AddonGroupService {

  async list(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.addonGroup.findMany({
      where,
      include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getById(id: string) {
    const group = await prisma.addonGroup.findUnique({
      where: { id },
      include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
    });
    if (!group) throw new Error('Nie znaleziono grupy dodatków');
    return group;
  }

  async create(data: CreateAddonGroupInput) {
    return prisma.addonGroup.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        minSelect: data.minSelect ?? 0,
        maxSelect: data.maxSelect ?? 1,
        priceType: data.priceType,
        basePrice: data.basePrice ?? 0,
        icon: data.icon ?? null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: { addons: { include: { dish: true } } },
    });
  }

  async update(id: string, data: UpdateAddonGroupInput) {
    const existing = await prisma.addonGroup.findUnique({ where: { id } });
    if (!existing) throw new Error('Nie znaleziono grupy dodatków');

    return prisma.addonGroup.update({
      where: { id },
      data,
      include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
    });
  }

  async delete(id: string) {
    const group = await prisma.addonGroup.findUnique({ where: { id } });
    /* istanbul ignore next -- delete always called with valid existing group ID */
    if (!group) throw new Error('Nie znaleziono grupy dodatków');
    await prisma.addonGroup.delete({ where: { id } });
    return { success: true };
  }

  async assignDishes(groupId: string, input: AssignDishesToGroupInput) {
    const group = await prisma.addonGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Nie znaleziono grupy dodatków');

    await prisma.addonGroupDish.deleteMany({ where: { groupId } });

    const assignments = await Promise.all(
      input.dishes.map((dishData, index) =>
        prisma.addonGroupDish.create({
          data: {
            groupId,
            dishId: dishData.dishId,
            customPrice: dishData.customPrice ?? null,
            displayOrder: dishData.displayOrder ?? index,
          },
          include: { dish: true },
        })
      )
    );

    return assignments;
  }

  async removeDish(groupId: string, dishId: string) {
    const assignment = await prisma.addonGroupDish.findFirst({ where: { groupId, dishId } });
    if (!assignment) throw new Error('Nie znaleziono dania w grupie dodatków');
    await prisma.addonGroupDish.delete({ where: { id: assignment.id } });
    return { success: true };
  }
}

export const addonGroupService = new AddonGroupService();
