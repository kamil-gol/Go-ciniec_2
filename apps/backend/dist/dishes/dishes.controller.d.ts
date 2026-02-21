import { DishesService, CreateDishDto, UpdateDishDto } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    /**
     * GET /dishes
     * Get all dishes with optional filters
     */
    findAll(category?: string, isActive?: string, search?: string): Promise<{
        success: boolean;
        data: import("./dishes.service").DishWithCategory[];
    }>;
    /**
     * GET /dishes/:id
     * Get single dish by ID
     */
    findOne(id: string): Promise<{
        success: boolean;
        data: import("./dishes.service").DishWithCategory;
    }>;
    /**
     * GET /dishes/category/:category
     * Get dishes by category
     */
    findByCategory(category: string): Promise<{
        success: boolean;
        data: import("./dishes.service").DishWithCategory[];
    }>;
    /**
     * POST /dishes
     * Create new dish
     */
    create(createDishDto: CreateDishDto): Promise<{
        success: boolean;
        data: import("./dishes.service").DishWithCategory;
        message: string;
    }>;
    /**
     * PUT /dishes/:id
     * Update existing dish
     */
    update(id: string, updateDishDto: UpdateDishDto): Promise<{
        success: boolean;
        data: import("./dishes.service").DishWithCategory;
        message: string;
    }>;
    /**
     * DELETE /dishes/:id
     * Delete dish
     */
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * GET /dishes/stats/categories
     * Get dish categories with counts
     */
    getCategories(): Promise<{
        success: boolean;
        data: ({
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            color: string | null;
            icon: string | null;
            displayOrder: number;
        } & {
            _count: {
                dishes: number;
            };
        })[];
    }>;
}
//# sourceMappingURL=dishes.controller.d.ts.map