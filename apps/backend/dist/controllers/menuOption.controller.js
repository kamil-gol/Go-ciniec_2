/**
 * Menu Option Controller - with userId for audit
 */
import { menuService } from '../services/menu.service';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
const VALID_CATEGORIES = [
    'DRINK', 'ALCOHOL', 'DESSERT', 'EXTRA_DISH', 'SERVICE',
    'DECORATION', 'ENTERTAINMENT', 'OTHER',
];
const VALID_PRICE_TYPES = ['PER_PERSON', 'PER_ITEM', 'FLAT'];
class MenuOptionController {
    async list(req, res, next) {
        try {
            const { category, isActive, search } = req.query;
            const filters = {};
            if (category)
                filters.category = category;
            if (isActive !== undefined)
                filters.isActive = isActive === 'true';
            if (search)
                filters.search = search;
            const options = await menuService.getOptions(filters);
            logger.info(`[MenuOption] Listed ${options.length} options`, { filters });
            res.json({
                success: true,
                data: options,
                count: options.length,
            });
        }
        catch (error) {
            logger.error('[MenuOption] List error:', error);
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const option = await menuService.getOptionById(id);
            logger.info(`[MenuOption] Retrieved option: ${option.name}`);
            res.json({
                success: true,
                data: option,
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Option not found') {
                res.status(404).json({
                    success: false,
                    error: 'Menu option not found',
                });
                return;
            }
            logger.error('[MenuOption] GetById error:', error);
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { name, description, shortDescription, category, priceType, priceAmount, allowMultiple, maxQuantity, icon, imageUrl, thumbnailUrl, isActive, displayOrder, } = req.body;
            const userId = req.user?.id;
            if (!userId)
                throw AppError.unauthorized('User not authenticated');
            if (!name || !category || !priceType) {
                res.status(400).json({
                    success: false,
                    error: 'Name, category, and priceType are required',
                });
                return;
            }
            if (!VALID_CATEGORIES.includes(category)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
                });
                return;
            }
            if (!VALID_PRICE_TYPES.includes(priceType)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid priceType. Must be one of: ${VALID_PRICE_TYPES.join(', ')}`,
                });
                return;
            }
            const option = await menuService.createOption({
                name, description, shortDescription, category, priceType,
                priceAmount: priceAmount || 0,
                allowMultiple: allowMultiple || false,
                maxQuantity: maxQuantity || 1,
                icon, imageUrl, thumbnailUrl,
                isActive: isActive !== undefined ? isActive : true,
                displayOrder: displayOrder || 0,
            }, userId);
            logger.info(`[MenuOption] Created: ${option.name} (${option.id})`);
            res.status(201).json({
                success: true,
                data: option,
                message: 'Menu option created successfully',
            });
        }
        catch (error) {
            logger.error('[MenuOption] Create error:', error);
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;
            if (!userId)
                throw AppError.unauthorized('User not authenticated');
            if (updateData.category && !VALID_CATEGORIES.includes(updateData.category)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
                });
                return;
            }
            if (updateData.priceType && !VALID_PRICE_TYPES.includes(updateData.priceType)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid priceType. Must be one of: ${VALID_PRICE_TYPES.join(', ')}`,
                });
                return;
            }
            const option = await menuService.updateOption(id, updateData, userId);
            logger.info(`[MenuOption] Updated: ${option.name} (${option.id})`);
            res.json({
                success: true,
                data: option,
                message: 'Menu option updated successfully',
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Option not found') {
                res.status(404).json({
                    success: false,
                    error: 'Menu option not found',
                });
                return;
            }
            logger.error('[MenuOption] Update error:', error);
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId)
                throw AppError.unauthorized('User not authenticated');
            await menuService.deleteOption(id, userId);
            logger.info(`[MenuOption] Deleted: ${id}`);
            res.json({
                success: true,
                message: 'Menu option deleted successfully',
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Option not found') {
                res.status(404).json({
                    success: false,
                    error: 'Menu option not found',
                });
                return;
            }
            logger.error('[MenuOption] Delete error:', error);
            next(error);
        }
    }
}
export const menuOptionController = new MenuOptionController();
//# sourceMappingURL=menuOption.controller.js.map