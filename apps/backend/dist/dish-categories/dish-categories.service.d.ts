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
export interface UpdateDishCategoryDto extends Partial<CreateDishCategoryDto> {
}
export type DishCategoryWithCount = DishCategory & {
    _count: {
        dishes: number;
    };
};
export declare class DishCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    /**
     * Get all categories
     */
    findAll(): Promise<DishCategoryWithCount[]>;
    /**
     * Get single category by ID
     */
    findOne(id: string): Promise<DishCategoryWithCount>;
    /**
     * Get category by slug
     */
    findBySlug(slug: string): Promise<DishCategoryWithCount>;
    /**
     * Create new category
     */
    create(data: CreateDishCategoryDto): Promise<DishCategory>;
    /**
     * Update existing category
     */
    update(id: string, data: UpdateDishCategoryDto): Promise<DishCategory>;
    /**
     * Delete category
     */
    remove(id: string): Promise<void>;
    /**
     * Reorder categories
     */
    reorder(orderedIds: string[]): Promise<void>;
}
//# sourceMappingURL=dish-categories.service.d.ts.map