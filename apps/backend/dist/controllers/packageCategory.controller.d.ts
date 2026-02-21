/**
 * Package Category Settings Controller
 *
 * Handles CRUD for PackageCategorySettings
 * Links packages to dish categories with min/max selection rules
 */
import { Request, Response } from 'express';
declare class PackageCategoryController {
    /**
     * GET /api/menu-packages/:packageId/categories
     * Get all categories configured for a package with their dishes
     */
    getByPackage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/package-category-settings/:id
     * Get single category setting
     */
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/package-category-settings
     * Create category setting (Admin only)
     */
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/package-category-settings/:id
     * Update category setting (Admin only)
     */
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/package-category-settings/:id
     * Delete category setting (Admin only)
     */
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/menu-packages/:packageId/categories
     * Bulk update category settings for a package (Admin only)
     *
     * Body: {
     *   settings: Array<{
     *     categoryId: string;
     *     minSelect: number;
     *     maxSelect: number;
     *     isRequired: boolean;
     *     isEnabled: boolean;
     *     displayOrder: number;
     *     customLabel?: string;
     *   }>
     * }
     */
    bulkUpdate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const packageCategoryController: PackageCategoryController;
export {};
//# sourceMappingURL=packageCategory.controller.d.ts.map