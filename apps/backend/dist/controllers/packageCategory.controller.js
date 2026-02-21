/**
 * Package Category Settings Controller
 *
 * Handles CRUD for PackageCategorySettings
 * Links packages to dish categories with min/max selection rules
 */
import { PrismaClient } from '@prisma/client';
import { bulkUpdateCategorySettingsSchema } from '@/validation/menu.validation';
const prisma = new PrismaClient();
function toNumber(decimal) {
    return parseFloat(decimal.toString());
}
class PackageCategoryController {
    /**
     * GET /api/menu-packages/:packageId/categories
     * Get all categories configured for a package with their dishes
     */
    async getByPackage(req, res) {
        try {
            const { packageId } = req.params;
            console.log('[PackageCategory] Fetching categories for package:', packageId);
            // Fetch package with category settings
            const menuPackage = await prisma.menuPackage.findUnique({
                where: { id: packageId },
                include: {
                    categorySettings: {
                        where: { isEnabled: true },
                        include: {
                            category: {
                                include: {
                                    dishes: {
                                        where: { isActive: true },
                                        orderBy: { displayOrder: 'asc' },
                                    },
                                },
                            },
                        },
                        orderBy: { displayOrder: 'asc' },
                    },
                },
            });
            if (!menuPackage) {
                return res.status(404).json({ error: 'Package not found' });
            }
            // Transform to frontend-friendly format
            const categories = menuPackage.categorySettings.map((setting) => ({
                id: setting.id,
                categoryId: setting.categoryId,
                categoryName: setting.category.name,
                categorySlug: setting.category.slug,
                categoryIcon: setting.category.icon,
                categoryColor: setting.category.color,
                minSelect: toNumber(setting.minSelect),
                maxSelect: toNumber(setting.maxSelect),
                isRequired: setting.isRequired,
                customLabel: setting.customLabel || setting.category.name,
                displayOrder: setting.displayOrder,
                dishes: setting.category.dishes.map((dish) => ({
                    id: dish.id,
                    name: dish.name,
                    description: dish.description,
                    allergens: dish.allergens,
                    displayOrder: dish.displayOrder,
                })),
            }));
            console.log('[PackageCategory] Returning', categories.length, 'categories with dishes');
            res.json({
                success: true,
                data: {
                    packageId: menuPackage.id,
                    packageName: menuPackage.name,
                    categories,
                },
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in getByPackage:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    /**
     * GET /api/package-category-settings/:id
     * Get single category setting
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const setting = await prisma.packageCategorySettings.findUnique({
                where: { id },
                include: {
                    category: true,
                    package: true,
                },
            });
            if (!setting) {
                return res.status(404).json({ error: 'Category setting not found' });
            }
            res.json({
                success: true,
                data: setting,
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in getById:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    /**
     * POST /api/package-category-settings
     * Create category setting (Admin only)
     */
    async create(req, res) {
        try {
            const { packageId, categoryId, minSelect, maxSelect, isRequired, isEnabled, displayOrder, customLabel } = req.body;
            // Validate required fields
            if (!packageId || !categoryId) {
                return res.status(400).json({ error: 'packageId and categoryId are required' });
            }
            // Validate min <= max
            if (minSelect > maxSelect) {
                return res.status(400).json({ error: 'Minimalna warto\u015b\u0107 nie mo\u017ce by\u0107 wi\u0119ksza ni\u017c maksymalna' });
            }
            // Check if package exists
            const packageExists = await prisma.menuPackage.findUnique({
                where: { id: packageId },
            });
            if (!packageExists) {
                return res.status(404).json({ error: 'Package not found' });
            }
            // Check if category exists
            const categoryExists = await prisma.dishCategory.findUnique({
                where: { id: categoryId },
            });
            if (!categoryExists) {
                return res.status(404).json({ error: 'Category not found' });
            }
            // Check if setting already exists
            const existing = await prisma.packageCategorySettings.findUnique({
                where: {
                    packageId_categoryId: {
                        packageId,
                        categoryId,
                    },
                },
            });
            if (existing) {
                return res.status(409).json({ error: 'Category setting already exists for this package' });
            }
            // Create setting
            const setting = await prisma.packageCategorySettings.create({
                data: {
                    packageId,
                    categoryId,
                    minSelect: minSelect || 1,
                    maxSelect: maxSelect || 1,
                    isRequired: isRequired !== undefined ? isRequired : true,
                    isEnabled: isEnabled !== undefined ? isEnabled : true,
                    displayOrder: displayOrder || 0,
                    customLabel: customLabel || null,
                },
                include: {
                    category: true,
                },
            });
            console.log('[PackageCategory] Created setting:', setting.id);
            res.status(201).json({
                success: true,
                data: setting,
                message: 'Category setting created successfully',
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in create:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    /**
     * PUT /api/package-category-settings/:id
     * Update category setting (Admin only)
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { minSelect, maxSelect, isRequired, isEnabled, displayOrder, customLabel } = req.body;
            // Validate min <= max
            if (minSelect !== undefined && maxSelect !== undefined && minSelect > maxSelect) {
                return res.status(400).json({ error: 'Minimalna warto\u015b\u0107 nie mo\u017ce by\u0107 wi\u0119ksza ni\u017c maksymalna' });
            }
            // Check if setting exists
            const existing = await prisma.packageCategorySettings.findUnique({
                where: { id },
            });
            if (!existing) {
                return res.status(404).json({ error: 'Category setting not found' });
            }
            // Update setting
            const updated = await prisma.packageCategorySettings.update({
                where: { id },
                data: {
                    ...(minSelect !== undefined && { minSelect }),
                    ...(maxSelect !== undefined && { maxSelect }),
                    ...(isRequired !== undefined && { isRequired }),
                    ...(isEnabled !== undefined && { isEnabled }),
                    ...(displayOrder !== undefined && { displayOrder }),
                    ...(customLabel !== undefined && { customLabel }),
                },
                include: {
                    category: true,
                    package: true,
                },
            });
            console.log('[PackageCategory] Updated setting:', id);
            res.json({
                success: true,
                data: updated,
                message: 'Category setting updated successfully',
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in update:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    /**
     * DELETE /api/package-category-settings/:id
     * Delete category setting (Admin only)
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            // Check if setting exists
            const existing = await prisma.packageCategorySettings.findUnique({
                where: { id },
            });
            if (!existing) {
                return res.status(404).json({ error: 'Category setting not found' });
            }
            // Delete setting
            await prisma.packageCategorySettings.delete({
                where: { id },
            });
            console.log('[PackageCategory] Deleted setting:', id);
            res.json({
                success: true,
                message: 'Category setting deleted successfully',
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in delete:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
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
    async bulkUpdate(req, res) {
        try {
            const { packageId } = req.params;
            console.log('[PackageCategory] Bulk updating categories for package:', packageId);
            console.log('[PackageCategory] Request body:', JSON.stringify(req.body, null, 2));
            // Validate input using Zod schema
            const validation = bulkUpdateCategorySettingsSchema.safeParse(req.body);
            if (!validation.success) {
                console.error('[PackageCategory] Validation failed:', validation.error.errors);
                return res.status(400).json({
                    error: 'Validation error',
                    details: validation.error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            const { settings } = validation.data;
            console.log('[PackageCategory] Validated settings:', settings?.length || 0);
            // Check if package exists
            const packageExists = await prisma.menuPackage.findUnique({
                where: { id: packageId },
            });
            if (!packageExists) {
                return res.status(404).json({ error: 'Package not found' });
            }
            // Perform bulk update in transaction
            const result = await prisma.$transaction(async (tx) => {
                // 1. Delete all existing settings for this package
                await tx.packageCategorySettings.deleteMany({
                    where: { packageId },
                });
                console.log('[PackageCategory] Deleted old settings');
                // 2. Create new settings
                if (settings.length > 0) {
                    const createdSettings = await Promise.all(settings.map((setting) => tx.packageCategorySettings.create({
                        data: {
                            packageId,
                            categoryId: setting.categoryId,
                            minSelect: setting.minSelect,
                            maxSelect: setting.maxSelect,
                            isRequired: setting.isRequired !== undefined ? setting.isRequired : true,
                            isEnabled: setting.isEnabled !== undefined ? setting.isEnabled : true,
                            displayOrder: setting.displayOrder || 0,
                            customLabel: setting.customLabel || null,
                        },
                        include: {
                            category: true,
                        },
                    })));
                    console.log('[PackageCategory] Created', createdSettings.length, 'new settings');
                    return createdSettings;
                }
                return [];
            });
            res.json({
                success: true,
                data: result,
                message: `Updated ${result.length} category settings`,
            });
        }
        catch (error) {
            console.error('[PackageCategory] Error in bulkUpdate:', error);
            /* istanbul ignore next -- error always has message in practice */
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
}
export const packageCategoryController = new PackageCategoryController();
//# sourceMappingURL=packageCategory.controller.js.map