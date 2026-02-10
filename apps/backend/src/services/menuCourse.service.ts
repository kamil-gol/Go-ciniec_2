/**
 * Menu Course Service
 * 
 * Handles all business logic for menu course operations
 */

import { PrismaClient } from '@prisma/client';
import { dishService } from './dish.service';

const prisma = new PrismaClient();

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
  
  /**
   * List all courses for a package
   */
  async listByPackage(packageId: string) {
    return await prisma.menuCourse.findMany({
      where: { packageId },
      include: {
        options: {
          include: {
            dish: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * Get single course by ID
   */
  async getById(id: string) {
    const course = await prisma.menuCourse.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            dish: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Create new course
   */
  async create(data: CreateMenuCourseInput) {
    // Verify package exists
    const packageExists = await prisma.menuPackage.findUnique({
      where: { id: data.packageId }
    });

    if (!packageExists) {
      throw new Error('Package not found');
    }

    return await prisma.menuCourse.create({
      data: {
        packageId: data.packageId,
        name: data.name,
        description: data.description,
        minSelect: data.minSelect ?? 1,
        maxSelect: data.maxSelect ?? 1,
        isRequired: data.isRequired ?? true,
        displayOrder: data.displayOrder ?? 0,
        icon: data.icon
      },
      include: {
        options: {
          include: { dish: true }
        }
      }
    });
  }

  /**
   * Update course
   */
  async update(id: string, data: UpdateMenuCourseInput) {
    // Check if course exists
    await this.getById(id);

    return await prisma.menuCourse.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        minSelect: data.minSelect,
        maxSelect: data.maxSelect,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder,
        icon: data.icon
      },
      include: {
        options: {
          include: { dish: true }
        }
      }
    });
  }

  /**
   * Delete course
   */
  async delete(id: string) {
    // Check if course exists
    await this.getById(id);

    // Cascade delete will handle MenuCourseOption records
    return await prisma.menuCourse.delete({
      where: { id }
    });
  }

  /**
   * Assign dishes to course
   */
  async assignDishes(courseId: string, dishes: AssignDishInput[]) {
    // Check if course exists
    const course = await this.getById(courseId);

    // Verify all dishes exist
    const dishIds = dishes.map(d => d.dishId);
    const foundDishes = await dishService.getByIds(dishIds);

    if (foundDishes.length !== dishIds.length) {
      const foundIds = foundDishes.map(d => d.id);
      const missingIds = dishIds.filter(id => !foundIds.includes(id));
      throw new Error(`Dishes not found: ${missingIds.join(', ')}`);
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Remove existing dish assignments
      await tx.menuCourseOption.deleteMany({
        where: { courseId }
      });

      // Create new assignments
      const assignments = dishes.map((dish, index) => ({
        courseId,
        dishId: dish.dishId,
        customPrice: dish.customPrice,
        isDefault: dish.isDefault ?? false,
        isRecommended: dish.isRecommended ?? false,
        displayOrder: dish.displayOrder ?? index
      }));

      await tx.menuCourseOption.createMany({
        data: assignments
      });
    });

    // Return updated course
    return await this.getById(courseId);
  }

  /**
   * Remove dish from course
   */
  async removeDish(courseId: string, dishId: string) {
    // Check if course exists
    await this.getById(courseId);

    // Check if assignment exists
    const assignment = await prisma.menuCourseOption.findFirst({
      where: {
        courseId,
        dishId
      }
    });

    if (!assignment) {
      throw new Error('Dish not assigned to this course');
    }

    return await prisma.menuCourseOption.delete({
      where: { id: assignment.id }
    });
  }

  /**
   * Get course with dish options for client selection
   */
  async getForSelection(courseId: string) {
    const course = await prisma.menuCourse.findUnique({
      where: { id },
      include: {
        options: {
          where: {
            dish: {
              isActive: true
            }
          },
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                allergens: true,
                priceModifier: true,
                imageUrl: true,
                thumbnailUrl: true
              }
            }
          },
          orderBy: [
            { isRecommended: 'desc' },
            { isDefault: 'desc' },
            { displayOrder: 'asc' }
          ]
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Reorder dishes within a course
   */
  async reorderDishes(courseId: string, orders: Array<{ dishId: string; displayOrder: number }>) {
    // Verify course exists
    await this.getById(courseId);

    // Update display orders in transaction
    await prisma.$transaction(
      orders.map(({ dishId, displayOrder }) =>
        prisma.menuCourseOption.updateMany({
          where: {
            courseId,
            dishId
          },
          data: { displayOrder }
        })
      )
    );

    return await this.getById(courseId);
  }
}

export const menuCourseService = new MenuCourseService();
