/**
 * Menu Course Service
 * Handles all business logic for menu course operations
 */

import { prisma } from '@/lib/prisma';
import { dishService } from './dish.service';

export interface CreateMenuCourseInput {
  packageId: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
  icon?: string;
}

export interface UpdateMenuCourseInput {
  name?: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
  icon?: string;
}

export interface AssignDishInput {
  dishId: string;
  customPrice?: number;
  isDefault?: boolean;
  isRecommended?: boolean;
  displayOrder?: number;
}

export class MenuCourseService {
  
  async listByPackage(packageId: string) {
    return prisma.menuCourse.findMany({
      where: { packageId },
      include: { options: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getById(id: string) {
    const course = await prisma.menuCourse.findUnique({
      where: { id },
      include: { options: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } }
    });
    if (!course) throw new Error('Course not found');
    return course;
  }

  async create(data: CreateMenuCourseInput) {
    const packageExists = await prisma.menuPackage.findUnique({ where: { id: data.packageId } });
    if (!packageExists) throw new Error('Package not found');

    return prisma.menuCourse.create({
      data: {
        packageId: data.packageId, name: data.name, description: data.description,
        minSelect: data.minSelect ?? 1, maxSelect: data.maxSelect ?? 1,
        isRequired: data.isRequired ?? true, displayOrder: data.displayOrder ?? 0,
        icon: data.icon
      },
      include: { options: { include: { dish: true } } }
    });
  }

  async update(id: string, data: UpdateMenuCourseInput) {
    await this.getById(id);
    return prisma.menuCourse.update({
      where: { id },
      data: {
        name: data.name, description: data.description, minSelect: data.minSelect,
        maxSelect: data.maxSelect, isRequired: data.isRequired,
        displayOrder: data.displayOrder, icon: data.icon
      },
      include: { options: { include: { dish: true } } }
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return prisma.menuCourse.delete({ where: { id } });
  }

  async assignDishes(courseId: string, dishes: AssignDishInput[]) {
    await this.getById(courseId);
    const dishIds = dishes.map(d => d.dishId);
    const foundDishes = await dishService.getByIds(dishIds);
    if (foundDishes.length !== dishIds.length) {
      const foundIds = foundDishes.map(d => d.id);
      const missingIds = dishIds.filter(id => !foundIds.includes(id));
      throw new Error(`Dishes not found: ${missingIds.join(', ')}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuCourseOption.deleteMany({ where: { courseId } });
      await tx.menuCourseOption.createMany({
        data: dishes.map((dish, index) => ({
          courseId, dishId: dish.dishId, customPrice: dish.customPrice,
          isDefault: dish.isDefault ?? false, isRecommended: dish.isRecommended ?? false,
          displayOrder: dish.displayOrder ?? index
        }))
      });
    });

    return this.getById(courseId);
  }

  async removeDish(courseId: string, dishId: string) {
    await this.getById(courseId);
    const assignment = await prisma.menuCourseOption.findFirst({ where: { courseId, dishId } });
    if (!assignment) throw new Error('Dish not assigned to this course');
    return prisma.menuCourseOption.delete({ where: { id: assignment.id } });
  }

  async getForSelection(courseId: string) {
    const course = await prisma.menuCourse.findUnique({
      where: { id: courseId },
      include: {
        options: {
          where: { dish: { isActive: true } },
          include: {
            dish: {
              select: {
                id: true, name: true, description: true, category: true,
                allergens: true, imageUrl: true, thumbnailUrl: true
              }
            }
          },
          orderBy: [{ isRecommended: 'desc' }, { isDefault: 'desc' }, { displayOrder: 'asc' }]
        }
      }
    });
    if (!course) throw new Error('Course not found');
    return course;
  }

  async reorderDishes(courseId: string, orders: Array<{ dishId: string; displayOrder: number }>) {
    await this.getById(courseId);
    await prisma.$transaction(
      orders.map(({ dishId, displayOrder }) =>
        prisma.menuCourseOption.updateMany({ where: { courseId, dishId }, data: { displayOrder } })
      )
    );
    return this.getById(courseId);
  }
}

export const menuCourseService = new MenuCourseService();
