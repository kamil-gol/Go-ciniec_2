import { PrismaService } from '../prisma/prisma.service';
import { Dish, DishCategory } from '@prisma/client';
export type DishWithCategory = Dish & {
    category: DishCategory;
};
export interface DishFilters {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
}
export interface CreateDishDto {
    name: string;
    description?: string | null;
    categoryId: string;
    allergens?: string[];
    isActive?: boolean;
}
export interface UpdateDishDto extends Partial<CreateDishDto> {
}
export declare class DishesService {
    private prisma;
    constructor(prisma: PrismaService);
    /**
     * Get all dishes with optional filters
     */
    findAll(filters?: DishFilters): Promise<DishWithCategory[]>;
    /**
     * Get single dish by ID
     */
    findOne(id: string): Promise<DishWithCategory>;
    /**
     * Get dishes by category ID
     */
    findByCategory(categoryId: string): Promise<DishWithCategory[]>;
    /**
     * Create new dish
     */
    create(data: CreateDishDto): Promise<DishWithCategory>;
    /**
     * Update existing dish
     */
    update(id: string, data: UpdateDishDto): Promise<DishWithCategory>;
    /**
     * Delete dish
     */
    remove(id: string): Promise<void>;
    /**
     * Get dish categories with counts
     */
    getCategories(): Promise<Array<DishCategory & {
        _count: {
            dishes: number;
        };
    }>>;
}
//# sourceMappingURL=dishes.service.d.ts.map