/**
 * Package Category Settings Service
 * Business logic for managing category settings for menu packages
 */
import { prisma } from '@/lib/prisma';
class PackageCategoryService {
    async getByPackageId(packageId) {
        return prisma.packageCategorySettings.findMany({ where: { packageId }, orderBy: { displayOrder: 'asc' } });
    }
    async getById(id) {
        const setting = await prisma.packageCategorySettings.findUnique({ where: { id } });
        if (!setting)
            throw new Error('Category setting not found');
        return setting;
    }
    async create(data) {
        const existing = await prisma.packageCategorySettings.findUnique({
            where: { packageId_category: { packageId: data.packageId, category: data.category } }
        });
        if (existing)
            throw new Error('Category setting already exists for this package');
        return prisma.packageCategorySettings.create({
            data: {
                packageId: data.packageId, category: data.category, minSelect: data.minSelect ?? 1,
                maxSelect: data.maxSelect ?? 1, isRequired: data.isRequired ?? true,
                isEnabled: data.isEnabled ?? true, displayOrder: data.displayOrder ?? 0,
                customLabel: data.customLabel ?? null
            }
        });
    }
    async update(id, data) {
        const existing = await prisma.packageCategorySettings.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Category setting not found');
        return prisma.packageCategorySettings.update({ where: { id }, data });
    }
    async bulkUpdate(packageId, input) {
        const pkg = await prisma.menuPackage.findUnique({ where: { id: packageId } });
        if (!pkg)
            throw new Error('Package not found');
        const results = [];
        for (const settingData of input.settings) {
            const existing = await prisma.packageCategorySettings.findUnique({
                where: { packageId_category: { packageId, category: settingData.category } }
            });
            if (existing) {
                const updated = await prisma.packageCategorySettings.update({
                    where: { id: existing.id },
                    data: {
                        minSelect: settingData.minSelect, maxSelect: settingData.maxSelect,
                        isRequired: settingData.isRequired, isEnabled: settingData.isEnabled,
                        displayOrder: settingData.displayOrder, customLabel: settingData.customLabel
                    }
                });
                results.push(updated);
            }
        }
        return results;
    }
    async delete(id) {
        const setting = await prisma.packageCategorySettings.findUnique({ where: { id } });
        if (!setting)
            throw new Error('Category setting not found');
        await prisma.packageCategorySettings.delete({ where: { id } });
        return { success: true };
    }
}
export const packageCategoryService = new PackageCategoryService();
//# sourceMappingURL=packageCategory.service.js.map