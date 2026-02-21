/**
 * Dish Controller - with userId for audit
 */
import dishService from '../services/dish.service';
import { AppError } from '../utils/AppError';
class DishController {
    async getDishes(req, res) {
        const { categoryId, isActive, search } = req.query;
        const filters = {};
        if (categoryId)
            filters.categoryId = categoryId;
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        if (search)
            filters.search = search;
        const dishes = await dishService.findAll(filters);
        res.status(200).json({ success: true, data: dishes });
    }
    async getDishById(req, res) {
        const { id } = req.params;
        const dish = await dishService.findOne(id);
        if (!dish)
            throw AppError.notFound('Dish');
        res.status(200).json({ success: true, data: dish });
    }
    async getDishesByCategory(req, res) {
        const { categoryId } = req.params;
        const dishes = await dishService.findByCategory(categoryId);
        res.status(200).json({ success: true, data: dishes });
    }
    async createDish(req, res) {
        const { name, description, categoryId, allergens, isActive } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized('User not authenticated');
        if (!name || !categoryId)
            throw AppError.badRequest('Name and categoryId are required');
        const dish = await dishService.create({
            name, description, categoryId,
            allergens: allergens || [],
            isActive: isActive ?? true,
        }, userId);
        res.status(201).json({
            success: true,
            data: dish,
            message: 'Dish created successfully',
        });
    }
    async updateDish(req, res) {
        const { id } = req.params;
        const { name, description, categoryId, allergens, isActive } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized('User not authenticated');
        const dish = await dishService.update(id, {
            name, description, categoryId, allergens, isActive,
        }, userId);
        res.status(200).json({
            success: true,
            data: dish,
            message: 'Dish updated successfully',
        });
    }
    async deleteDish(req, res) {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized('User not authenticated');
        await dishService.remove(id, userId);
        res.status(200).json({
            success: true,
            message: 'Dish deleted successfully',
        });
    }
}
export default new DishController();
//# sourceMappingURL=dish.controller.js.map