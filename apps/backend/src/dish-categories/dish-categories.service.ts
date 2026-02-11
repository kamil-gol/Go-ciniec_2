import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DishCategory } from '@prisma/client';

export interface CreateDishCategoryDto {
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateDishCategoryDto extends Partial<CreateDishCategoryDto> {}

export type DishCategoryWithCount = DishCategory & { _count: { dishes: number } };

@Injectable()
export class DishCategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories
   */
  async findAll(): Promise<DishCategoryWithCount[]> {
    return this.prisma.dishCategory.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get single category by ID
   */
  async findOne(id: string): Promise<DishCategoryWithCount> {
    const category = await this.prisma.dishCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string): Promise<DishCategoryWithCount> {
    const category = await this.prisma.dishCategory.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  /**
   * Create new category
   */
  async create(data: CreateDishCategoryDto): Promise<DishCategory> {
    // Check if category with same slug already exists
    const existing = await this.prisma.dishCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${data.slug}" already exists`);
    }

    return this.prisma.dishCategory.create({
      data: {
        slug: data.slug.toUpperCase(),
        name: data.name,
        icon: data.icon,
        color: data.color,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update existing category
   */
  async update(id: string, data: UpdateDishCategoryDto): Promise<DishCategory> {
    // Check if category exists
    await this.findOne(id);

    // If updating slug, check for conflicts
    if (data.slug) {
      const existing = await this.prisma.dishCategory.findFirst({
        where: {
          slug: data.slug.toUpperCase(),
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Category with slug "${data.slug}" already exists`);
      }

      // Uppercase the slug
      data.slug = data.slug.toUpperCase();
    }

    return this.prisma.dishCategory.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete category
   */
  async remove(id: string): Promise<void> {
    // Check if category exists
    const category = await this.findOne(id);

    // Check if category has dishes
    if (category._count.dishes > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}" because it has ${category._count.dishes} dish(es) assigned`,
      );
    }

    await this.prisma.dishCategory.delete({
      where: { id },
    });
  }

  /**
   * Reorder categories
   */
  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      this.prisma.dishCategory.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);
  }
}
