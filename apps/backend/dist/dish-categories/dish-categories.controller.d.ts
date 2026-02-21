import { DishCategoriesService, CreateDishCategoryDto, UpdateDishCategoryDto } from './dish-categories.service';
export declare class DishCategoriesController {
    private readonly dishCategoriesService;
    constructor(dishCategoriesService: DishCategoriesService);
    /**
     * GET /dish-categories
     * Get all categories (public)
     */
    findAll(): Promise<import("./dish-categories.service").DishCategoryWithCount[]>;
    /**
     * GET /dish-categories/:id
     * Get single category (public)
     */
    findOne(id: string): Promise<import("./dish-categories.service").DishCategoryWithCount>;
    /**
     * GET /dish-categories/slug/:slug
     * Get category by slug (public)
     */
    findBySlug(slug: string): Promise<import("./dish-categories.service").DishCategoryWithCount>;
    /**
     * POST /dish-categories
     * Create new category (protected)
     */
    create(data: CreateDishCategoryDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        color: string | null;
        icon: string | null;
        displayOrder: number;
    }>;
    /**
     * PUT /dish-categories/:id
     * Update category (protected)
     */
    update(id: string, data: UpdateDishCategoryDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        color: string | null;
        icon: string | null;
        displayOrder: number;
    }>;
    /**
     * DELETE /dish-categories/:id
     * Delete category (protected)
     */
    remove(id: string): Promise<void>;
    /**
     * POST /dish-categories/reorder
     * Reorder categories (protected)
     */
    reorder(data: {
        ids: string[];
    }): Promise<void>;
}
//# sourceMappingURL=dish-categories.controller.d.ts.map