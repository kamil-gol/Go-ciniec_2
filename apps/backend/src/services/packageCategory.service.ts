/**
 * Package Category Settings Service
 * 
 * Business logic for managing category settings for menu packages
 */

import { PrismaClient, DishCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCategorySettingInput {
  packageId: string;
  category: DishCategory;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  displayOrder?: number;
  customLabel?: string | null;
}

export interface UpdateCategorySettingInput {
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  displayOrder?: number;
  customLabel?: string | null;
}

export interface BulkUpdateCategorySettingsInput {
  settings: Array<{
    category: DishCategory;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    displayOrder?: number;
    customLabel?: string | null;
  }>;
}

class PackageCategoryService {

  /**
   * Get all category settings for a package
   */
  async getByPackageId(packageId: string) {
    const settings = await prisma.packageCategorySettings.findMany({
      where: { packageId },
      orderBy: { displayOrder: 'asc' },
    });

    return settings;
  }

  /**
   * Get single category setting
   */
  async getById(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new Error('Category setting not found');
    }

    return setting;
  }

  /**
   * Create category setting
   */
  async create(data: CreateCategorySettingInput) {
    // Check if setting already exists for this package + category
    const existing = await prisma.packageCategorySettings.findUnique({
      where: {
        packageId_category: {
          packageId: data.packageId,
          category: data.category,
        },
      },
    });

    if (existing) {
      throw new Error('Category setting already exists for this package');
    }

    const setting = await prisma.packageCategorySettings.create({
      data: {
        packageId: data.packageId,
        category: data.category,
        minSelect: data.minSelect ?? 1,
        maxSelect: data.maxSelect ?? 1,
        isRequired: data.isRequired ?? true,
        isEnabled: data.isEnabled ?? true,
        displayOrder: data.displayOrder ?? 0,
        customLabel: data.customLabel ?? null,
      },
    });

    return setting;
  }

  /**
   * Update category setting
   */
  async update(id: string, data: UpdateCategorySettingInput) {
    // Check if setting exists
    const existing = await prisma.packageCategorySettings.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Category setting not found');
    }

    const setting = await prisma.packageCategorySettings.update({
      where: { id },
      data,
    });

    return setting;
  }

  /**
   * Bulk update category settings for a package
   */
  async bulkUpdate(packageId: string, input: BulkUpdateCategorySettingsInput) {
    // Verify package exists
    const pkg = await prisma.menuPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    // Update each setting
    const results = [];
    for (const settingData of input.settings) {
      const existing = await prisma.packageCategorySettings.findUnique({
        where: {
          packageId_category: {
            packageId,
            category: settingData.category,
          },
        },
      });

      if (existing) {
        // Update existing
        const updated = await prisma.packageCategorySettings.update({
          where: { id: existing.id },
          data: {
            minSelect: settingData.minSelect,
            maxSelect: settingData.maxSelect,
            isRequired: settingData.isRequired,
            isEnabled: settingData.isEnabled,
            displayOrder: settingData.displayOrder,
            customLabel: settingData.customLabel,
          },
        });
        results.push(updated);
      }
    }

    return results;
  }

  /**
   * Delete category setting
   */
  async delete(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new Error('Category setting not found');
    }

    await prisma.packageCategorySettings.delete({
      where: { id },
    });

    return { success: true };
  }
}

export const packageCategoryService = new PackageCategoryService();
