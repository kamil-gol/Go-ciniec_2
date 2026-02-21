/**
 * Dish Category Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: removed `new PrismaClient()` (connection leak)
 */
import { Request, Response } from 'express';
declare class DishCategoryController {
    getCategories(_req: Request, res: Response): Promise<void>;
    getCategoryById(req: Request, res: Response): Promise<void>;
    getCategoryBySlug(req: Request, res: Response): Promise<void>;
    createCategory(req: Request, res: Response): Promise<void>;
    updateCategory(req: Request, res: Response): Promise<void>;
    deleteCategory(req: Request, res: Response): Promise<void>;
    reorderCategories(req: Request, res: Response): Promise<void>;
}
declare const _default: DishCategoryController;
export default _default;
//# sourceMappingURL=dish-category.controller.d.ts.map