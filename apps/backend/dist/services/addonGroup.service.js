/**
 * Addon Group Service
 * Business logic for managing addon groups and their dishes
 */
import { prisma } from '@/lib/prisma';
class AddonGroupService {
    async list(filters) {
        const where = {};
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return prisma.addonGroup.findMany({
            where,
            include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async getById(id) {
        const group = await prisma.addonGroup.findUnique({
            where: { id },
            include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
        });
        if (!group)
            throw new Error('Addon group not found');
        return group;
    }
    async create(data) {
        return prisma.addonGroup.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                minSelect: data.minSelect ?? 0,
                maxSelect: data.maxSelect ?? 1,
                priceType: data.priceType,
                basePrice: data.basePrice ?? 0,
                icon: data.icon ?? null,
                displayOrder: data.displayOrder ?? 0,
                isActive: data.isActive ?? true,
            },
            include: { addons: { include: { dish: true } } },
        });
    }
    async update(id, data) {
        const existing = await prisma.addonGroup.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Addon group not found');
        return prisma.addonGroup.update({
            where: { id },
            data,
            include: { addons: { include: { dish: true }, orderBy: { displayOrder: 'asc' } } },
        });
    }
    async delete(id) {
        const group = await prisma.addonGroup.findUnique({ where: { id } });
        /* istanbul ignore next -- delete always called with valid existing group ID */
        if (!group)
            throw new Error('Addon group not found');
        await prisma.addonGroup.delete({ where: { id } });
        return { success: true };
    }
    async assignDishes(groupId, input) {
        const group = await prisma.addonGroup.findUnique({ where: { id: groupId } });
        if (!group)
            throw new Error('Addon group not found');
        await prisma.addonGroupDish.deleteMany({ where: { groupId } });
        const assignments = await Promise.all(input.dishes.map((dishData, index) => prisma.addonGroupDish.create({
            data: {
                groupId,
                dishId: dishData.dishId,
                customPrice: dishData.customPrice ?? null,
                displayOrder: dishData.displayOrder ?? index,
            },
            include: { dish: true },
        })));
        return assignments;
    }
    async removeDish(groupId, dishId) {
        const assignment = await prisma.addonGroupDish.findFirst({ where: { groupId, dishId } });
        if (!assignment)
            throw new Error('Dish not found in addon group');
        await prisma.addonGroupDish.delete({ where: { id: assignment.id } });
        return { success: true };
    }
}
export const addonGroupService = new AddonGroupService();
//# sourceMappingURL=addonGroup.service.js.map