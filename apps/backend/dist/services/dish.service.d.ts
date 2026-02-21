/**
 * Dish Service
 * Business logic for dish management
 */
import { Dish, DishCategory } from '@prisma/client';
export type DishWithCategory = Dish & {
    category: DishCategory;
};
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
export interface UpdateDishInput extends Partial<CreateDishInput> {
}
declare class DishService {
    findAll(filters?: DishFilters): Promise<DishWithCategory[]>;
    findOne(id: string): Promise<DishWithCategory | null>;
    getByIds(ids: string[]): Promise<DishWithCategory[]>;
    findByCategory(categoryId: string): Promise<DishWithCategory[]>;
    create(data: CreateDishInput, userId: string): Promise<DishWithCategory>;
    update(id: string, data: UpdateDishInput, userId: string): Promise<DishWithCategory>;
    toggleActive(id: string, userId: string): Promise<DishWithCategory>;
    remove(id: string, userId: string): Promise<void>;
}
declare const dishServiceInstance: DishService;
export default dishServiceInstance;
export { dishServiceInstance as dishService };
//# sourceMappingURL=dish.service.d.ts.map