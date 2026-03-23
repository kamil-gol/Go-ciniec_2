/**
 * Package Category Settings Service
 * Business logic for managing category settings for menu packages
 * Spolonizowany — komunikaty po polsku
 * Updated: #166 — Added portionTarget support (ALL | ADULTS_ONLY | CHILDREN_ONLY)
 * Refactored: all Prisma queries moved from controller, controller is now thin
 */

import { DishCategory } from '@/prisma-client';
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { MENU_CRUD } from '../i18n/pl';

// Valid portionTarget values
export const PORTION_TARGETS = ['ALL', 'ADULTS_ONLY', 'CHILDREN_ONLY'] as const;
export type PortionTarget = typeof PORTION_TARGETS[number];

export interface CreateCategorySettingInput {
  packageId: string;
  category: DishCategory;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  portionTarget?: PortionTarget;
  displayOrder?: number;
  customLabel?: string | null;
  extraItemPrice?: number | null;
  maxExtra?: number | null;
}

export interface UpdateCategorySettingInput {
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  portionTarget?: PortionTarget;
  displayOrder?: number;
  customLabel?: string | null;
  extraItemPrice?: number | null;
  maxExtra?: number | null;
}

export interface BulkUpdateCategorySettingsInput {
  settings: Array<{
    category: DishCategory;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    portionTarget?: PortionTarget;
    displayOrder?: number;
    customLabel?: string | null;
    extraItemPrice?: number | null;
    maxExtra?: number | null;
  }>;
}

function toNumber(decimal: any): number {
  return parseFloat(decimal.toString());
}

/**
 * #166: Validate portionTarget value at runtime.
 * Throws if value is provided but not in PORTION_TARGETS.
 */
function validatePortionTarget(value: string | undefined): void {
  if (value !== undefined && !(PORTION_TARGETS as readonly string[]).includes(value)) {
    throw AppError.badRequest(
      `Nieprawidłowa wartość portionTarget: "${value}". Dozwolone: ${PORTION_TARGETS.join(', ')}`
    );
  }
}

class PackageCategoryService {

  async getByPackageId(packageId: string) {
    return prisma.packageCategorySettings.findMany({ where: { packageId }, orderBy: { displayOrder: 'asc' } });
  }

  /**
   * Get all categories configured for a package with their dishes.
   * Sorts by global category displayOrder and transforms to frontend-friendly format.
   */
  async getByPackageWithDishes(packageId: string) {
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
        },
      },
    });

    if (!menuPackage) {
      throw AppError.notFound('Package');
    }

    // Sort by the GLOBAL category displayOrder (from DishCategory table)
    const sortedSettings = [...menuPackage.categorySettings].sort(
      (a, b) => (a.category.displayOrder ?? 0) - (b.category.displayOrder ?? 0)
    );

    // Transform to frontend-friendly format
    const categories = sortedSettings.map((setting) => ({
      id: setting.id,
      categoryId: setting.categoryId,
      categoryName: setting.category.name,
      categorySlug: setting.category.slug,
      categoryIcon: setting.category.icon,
      categoryColor: setting.category.color,

      minSelect: toNumber(setting.minSelect),
      maxSelect: toNumber(setting.maxSelect),
      isRequired: setting.isRequired,
      portionTarget: setting.portionTarget,
      customLabel: setting.customLabel || setting.category.name,
      displayOrder: setting.displayOrder,
      extraItemPrice: setting.extraItemPrice ? toNumber(setting.extraItemPrice) : null,
      maxExtra: setting.maxExtra,

      dishes: setting.category.dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        allergens: dish.allergens,
        displayOrder: dish.displayOrder,
      })),
    }));

    return {
      packageId: menuPackage.id,
      packageName: menuPackage.name,
      categories,
    };
  }

  async getById(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({
      where: { id },
      include: {
        category: true,
        package: true,
      },
    });
    if (!setting) throw AppError.notFound('Category setting');
    return setting;
  }

  async create(data: CreateCategorySettingInput) {
    validatePortionTarget(data.portionTarget);

    const existing = await prisma.packageCategorySettings.findUnique({
      where: { packageId_categoryId: { packageId: data.packageId, categoryId: data.category.id } }
    });
    if (existing) throw AppError.conflict('Ustawienia kategorii już istnieją dla tego pakietu');

    return prisma.packageCategorySettings.create({
      data: {
        packageId: data.packageId, categoryId: data.category.id, minSelect: data.minSelect ?? 1,
        maxSelect: data.maxSelect ?? 1, isRequired: data.isRequired ?? true,
        isEnabled: data.isEnabled ?? true, portionTarget: data.portionTarget ?? 'ALL',
        displayOrder: data.displayOrder ?? 0,
        customLabel: data.customLabel ?? null,
        extraItemPrice: data.extraItemPrice ?? null,
        maxExtra: data.maxExtra ?? null
      }
    });
  }

  /**
   * Create a category setting from raw controller input (categoryId string, not DishCategory object).
   * Validates that package and category exist, checks for duplicates.
   */
  async createFromInput(input: {
    packageId: string;
    categoryId: string;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    portionTarget?: string;
    displayOrder?: number;
    customLabel?: string | null;
    extraItemPrice?: number | null;
    maxExtra?: number | null;
  }) {
    if (!input.packageId || !input.categoryId) {
      throw AppError.badRequest('packageId and categoryId are required');
    }

    if (input.minSelect !== undefined && input.maxSelect !== undefined && input.minSelect > input.maxSelect) {
      throw AppError.badRequest('Minimalna wartość nie może być większa niż maksymalna');
    }

    validatePortionTarget(input.portionTarget);

    const packageExists = await prisma.menuPackage.findUnique({ where: { id: input.packageId } });
    if (!packageExists) throw AppError.notFound('Package');

    const categoryExists = await prisma.dishCategory.findUnique({ where: { id: input.categoryId } });
    if (!categoryExists) throw AppError.notFound('Category');

    const existing = await prisma.packageCategorySettings.findUnique({
      where: { packageId_categoryId: { packageId: input.packageId, categoryId: input.categoryId } },
    });
    if (existing) throw AppError.conflict('Category setting already exists for this package');

    return prisma.packageCategorySettings.create({
      data: {
        packageId: input.packageId,
        categoryId: input.categoryId,
        minSelect: input.minSelect || 1,
        maxSelect: input.maxSelect || 1,
        isRequired: input.isRequired !== undefined ? input.isRequired : true,
        isEnabled: input.isEnabled !== undefined ? input.isEnabled : true,
        portionTarget: input.portionTarget || 'ALL',
        displayOrder: input.displayOrder || 0,
        customLabel: input.customLabel || null,
        extraItemPrice: input.extraItemPrice !== undefined ? input.extraItemPrice : null,
        maxExtra: input.maxExtra !== undefined ? input.maxExtra : null,
      },
      include: { category: true },
    });
  }

  /**
   * Update a category setting by ID.
   * Validates existence, min <= max constraint, portionTarget.
   */
  async updateById(id: string, data: {
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    portionTarget?: string;
    displayOrder?: number;
    customLabel?: string | null;
    extraItemPrice?: number | null;
    maxExtra?: number | null;
  }) {
    if (data.minSelect !== undefined && data.maxSelect !== undefined && data.minSelect > data.maxSelect) {
      throw AppError.badRequest('Minimalna wartość nie może być większa niż maksymalna');
    }

    validatePortionTarget(data.portionTarget);

    const existing = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Category setting');

    return prisma.packageCategorySettings.update({
      where: { id },
      data: {
        ...(data.minSelect !== undefined && { minSelect: data.minSelect }),
        ...(data.maxSelect !== undefined && { maxSelect: data.maxSelect }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        ...(data.portionTarget !== undefined && { portionTarget: data.portionTarget }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.customLabel !== undefined && { customLabel: data.customLabel }),
        ...(data.extraItemPrice !== undefined && { extraItemPrice: data.extraItemPrice }),
        ...(data.maxExtra !== undefined && { maxExtra: data.maxExtra }),
      },
      include: {
        category: true,
        package: true,
      },
    });
  }

  async update(id: string, data: UpdateCategorySettingInput) {
    validatePortionTarget(data.portionTarget);

    const existing = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Category setting');
    return prisma.packageCategorySettings.update({ where: { id }, data });
  }

  async bulkUpdate(packageId: string, input: BulkUpdateCategorySettingsInput) {
    const pkg = await prisma.menuPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);

    // Validate all portionTarget values before any writes
    for (const settingData of input.settings) {
      validatePortionTarget(settingData.portionTarget);
    }

    const results = [];
    for (const settingData of input.settings) {
      const existing = await prisma.packageCategorySettings.findUnique({
        where: { packageId_categoryId: { packageId, categoryId: settingData.category.id } }
      });
      if (existing) {
        const updated = await prisma.packageCategorySettings.update({
          where: { id: existing.id },
          data: {
            minSelect: settingData.minSelect, maxSelect: settingData.maxSelect,
            isRequired: settingData.isRequired, isEnabled: settingData.isEnabled,
            portionTarget: settingData.portionTarget,
            displayOrder: settingData.displayOrder, customLabel: settingData.customLabel,
            extraItemPrice: settingData.extraItemPrice, maxExtra: settingData.maxExtra
          }
        });
        results.push(updated);
      }
    }
    return results;
  }

  /**
   * Bulk update category settings for a package using validated input from controller.
   * Deletes all existing settings and creates new ones in a transaction.
   */
  async bulkUpdateFromInput(packageId: string, settings: Array<{
    categoryId: string;
    minSelect: number;
    maxSelect: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    portionTarget?: string;
    displayOrder?: number;
    customLabel?: string | null;
    extraItemPrice?: number | null;
    maxExtra?: number | null;
  }>) {
    const packageExists = await prisma.menuPackage.findUnique({ where: { id: packageId } });
    if (!packageExists) throw AppError.notFound('Package');

    return prisma.$transaction(async (tx) => {
      // 1. Delete all existing settings for this package
      await tx.packageCategorySettings.deleteMany({ where: { packageId } });

      // 2. Create new settings
      if (settings.length === 0) return [];

      const createdSettings = await Promise.all(
        settings.map((setting) =>
          tx.packageCategorySettings.create({
            data: {
              packageId,
              categoryId: setting.categoryId,
              minSelect: setting.minSelect,
              maxSelect: setting.maxSelect,
              isRequired: setting.isRequired !== undefined ? setting.isRequired : true,
              isEnabled: setting.isEnabled !== undefined ? setting.isEnabled : true,
              portionTarget: setting.portionTarget || 'ALL',
              displayOrder: setting.displayOrder || 0,
              customLabel: setting.customLabel || null,
              extraItemPrice: setting.extraItemPrice !== undefined ? setting.extraItemPrice : null,
              maxExtra: setting.maxExtra !== undefined ? setting.maxExtra : null,
            },
            include: { category: true },
          })
        )
      );

      return createdSettings;
    });
  }

  async delete(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!setting) throw AppError.notFound('Category setting');
    await prisma.packageCategorySettings.delete({ where: { id } });
    return { success: true };
  }

  async deleteById(id: string) {
    const existing = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Category setting');
    await prisma.packageCategorySettings.delete({ where: { id } });
  }
}

export const packageCategoryService = new PackageCategoryService();
