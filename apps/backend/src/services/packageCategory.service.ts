/**
 * Package Category Settings Service
 * Business logic for managing category settings for menu packages
 * 🇵🇱 Spolonizowany — komunikaty po polsku
 * Updated: #166 — Added portionTarget support (ALL | ADULTS_ONLY | CHILDREN_ONLY)
 */

import { DishCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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
}

export interface UpdateCategorySettingInput {
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  portionTarget?: PortionTarget;
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
    portionTarget?: PortionTarget;
    displayOrder?: number;
    customLabel?: string | null;
  }>;
}

class PackageCategoryService {

  async getByPackageId(packageId: string) {
    return prisma.packageCategorySettings.findMany({ where: { packageId }, orderBy: { displayOrder: 'asc' } });
  }

  async getById(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!setting) throw new Error('Nie znaleziono ustawień kategorii');
    return setting;
  }

  async create(data: CreateCategorySettingInput) {
    const existing = await prisma.packageCategorySettings.findUnique({
      where: { packageId_categoryId: { packageId: data.packageId, categoryId: data.category.id } }
    });
    if (existing) throw new Error('Ustawienia kategorii już istnieją dla tego pakietu');

    return prisma.packageCategorySettings.create({
      data: {
        packageId: data.packageId, categoryId: data.category.id, minSelect: data.minSelect ?? 1,
        maxSelect: data.maxSelect ?? 1, isRequired: data.isRequired ?? true,
        isEnabled: data.isEnabled ?? true, portionTarget: data.portionTarget ?? 'ALL',
        displayOrder: data.displayOrder ?? 0,
        customLabel: data.customLabel ?? null
      }
    });
  }

  async update(id: string, data: UpdateCategorySettingInput) {
    const existing = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!existing) throw new Error('Nie znaleziono ustawień kategorii');
    return prisma.packageCategorySettings.update({ where: { id }, data });
  }

  async bulkUpdate(packageId: string, input: BulkUpdateCategorySettingsInput) {
    const pkg = await prisma.menuPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);

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
            displayOrder: settingData.displayOrder, customLabel: settingData.customLabel
          }
        });
        results.push(updated);
      }
    }
    return results;
  }

  async delete(id: string) {
    const setting = await prisma.packageCategorySettings.findUnique({ where: { id } });
    if (!setting) throw new Error('Nie znaleziono ustawień kategorii');
    await prisma.packageCategorySettings.delete({ where: { id } });
    return { success: true };
  }
}

export const packageCategoryService = new PackageCategoryService();
