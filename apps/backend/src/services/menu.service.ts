/**
 * Menu Service - with Audit Logging
 * Simplified: only added userId params + audit logChange() for key operations.
 * Full original logic preserved.
 * 🇵🇱 Spolonizowany — komunikaty błędów z i18n/pl.ts
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
import { MENU_CRUD } from '../i18n/pl';
import { 
  MenuTemplate, 
  MenuPackage, 
  MenuOption,
  MenuPackageOption,
  CreateMenuTemplateInput,
  UpdateMenuTemplateInput,
  CreateMenuPackageInput,
  UpdateMenuPackageInput,
  CreateMenuOptionInput,
  UpdateMenuOptionInput,
  AssignOptionsToPackageInput
} from '../types/menu.types';

export class MenuService {
  
  async getMenuTemplates(filters?: { eventTypeId?: string; isActive?: boolean; date?: Date }) {
    const where: Prisma.MenuTemplateWhereInput = {};
    if (filters?.eventTypeId) where.eventTypeId = filters.eventTypeId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.date) {
      where.AND = [
        { validFrom: { lte: filters.date } },
        { OR: [{ validTo: null }, { validTo: { gte: filters.date } }] }
      ];
    }

    return prisma.menuTemplate.findMany({
      where,
      include: {
        eventType: { select: { id: true, name: true, color: true } },
        packages: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true, name: true, pricePerAdult: true, pricePerChild: true,
            isPopular: true, isRecommended: true, color: true, icon: true
          }
        }
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }]
    });
  }

  async getMenuTemplateById(id: string) {
    const template = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        eventType: true,
        packages: {
          orderBy: { displayOrder: 'asc' },
          include: {
            packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } }
          }
        }
      }
    });
    if (!template) throw new Error(MENU_CRUD.TEMPLATE_NOT_FOUND);
    return template;
  }

  async getActiveMenuForEventType(eventTypeId: string, date: Date = new Date()) {
    const template = await prisma.menuTemplate.findFirst({
      where: {
        eventTypeId, isActive: true, validFrom: { lte: date },
        OR: [{ validTo: null }, { validTo: { gte: date } }]
      },
      include: {
        eventType: true,
        packages: {
          orderBy: { displayOrder: 'asc' },
          include: {
            packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } }
          }
        }
      }
    });
    if (!template) throw new Error(MENU_CRUD.NO_ACTIVE_MENU(eventTypeId));
    return template;
  }

  async createMenuTemplate(data: CreateMenuTemplateInput, userId: string) {
    const template = await prisma.menuTemplate.create({
      data: {
        eventTypeId: data.eventTypeId, name: data.name, description: data.description,
        variant: data.variant, validFrom: data.validFrom, validTo: data.validTo,
        isActive: data.isActive ?? true, displayOrder: data.displayOrder ?? 0,
        imageUrl: data.imageUrl
      },
      include: { eventType: true }
    });

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'MENU_TEMPLATE',
      entityId: template.id,
      details: { description: `Utworzono szablon menu: ${template.name}`, data: { name: template.name, eventTypeId: template.eventTypeId } }
    });

    return template;
  }

  async updateMenuTemplate(id: string, data: UpdateMenuTemplateInput, userId: string) {
    const existing = await prisma.menuTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error(MENU_CRUD.TEMPLATE_NOT_FOUND);

    const template = await prisma.menuTemplate.update({
      where: { id },
      data: {
        name: data.name, description: data.description, variant: data.variant,
        validFrom: data.validFrom, validTo: data.validTo, isActive: data.isActive,
        displayOrder: data.displayOrder, imageUrl: data.imageUrl
      },
      include: { eventType: true, packages: true }
    });

    const changes = diffObjects(existing, template);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'MENU_TEMPLATE',
        entityId: template.id,
        details: { description: `Zaktualizowano szablon menu: ${template.name}`, changes }
      });
    }

    return template;
  }

  async deleteMenuTemplate(id: string, userId: string) {
    const existing = await prisma.menuTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error(MENU_CRUD.TEMPLATE_NOT_FOUND);

    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: { menuData: { path: ['templateId'], equals: id } }
    });
    if (usageCount > 0) throw new Error(MENU_CRUD.CANNOT_DELETE_TEMPLATE(usageCount));

    await prisma.menuTemplate.delete({ where: { id } });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'MENU_TEMPLATE',
      entityId: id,
      details: { description: `Usunięto szablon menu: ${existing.name}`, deletedData: { name: existing.name } }
    });
  }

  async duplicateMenuTemplate(
    id: string,
    newData: { name: string; variant?: string; validFrom?: Date; validTo?: Date | null },
    userId: string
  ) {
    const original = await this.getMenuTemplateById(id);
    const newTemplate = await prisma.menuTemplate.create({
      data: {
        eventTypeId: original.eventTypeId, name: newData.name, description: original.description,
        variant: newData.variant ?? original.variant, validFrom: newData.validFrom ?? new Date(),
        validTo: newData.validTo ?? undefined, isActive: true, displayOrder: original.displayOrder
      }
    });

    for (const pkg of original.packages) {
      const newPackage = await prisma.menuPackage.create({
        data: {
          menuTemplateId: newTemplate.id, name: pkg.name, description: pkg.description,
          shortDescription: pkg.shortDescription, pricePerAdult: pkg.pricePerAdult,
          pricePerChild: pkg.pricePerChild, pricePerToddler: pkg.pricePerToddler,
          includedItems: pkg.includedItems, minGuests: pkg.minGuests, maxGuests: pkg.maxGuests,
          color: pkg.color, icon: pkg.icon, badgeText: pkg.badgeText,
          displayOrder: pkg.displayOrder, isPopular: pkg.isPopular, isRecommended: pkg.isRecommended
        }
      });

      for (const pkgOpt of pkg.packageOptions) {
        await prisma.menuPackageOption.create({
          data: {
            packageId: newPackage.id, optionId: pkgOpt.optionId, customPrice: pkgOpt.customPrice,
            isRequired: pkgOpt.isRequired, isDefault: pkgOpt.isDefault, displayOrder: pkgOpt.displayOrder
          }
        });
      }
    }

    await logChange({
      userId,
      action: 'DUPLICATE',
      entityType: 'MENU_TEMPLATE',
      entityId: newTemplate.id,
      details: { description: `Zduplikowano szablon menu: ${original.name} → ${newData.name}`, sourceId: id }
    });

    return this.getMenuTemplateById(newTemplate.id);
  }

  // ═══════════════════════════ MENU PACKAGES ═══════════════════════════

  async getAllPackages() {
    return prisma.menuPackage.findMany({
      include: {
        menuTemplate: { select: { id: true, name: true, eventType: { select: { id: true, name: true } } } },
        packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } },
        categorySettings: true
      },
      orderBy: [{ menuTemplateId: 'asc' }, { displayOrder: 'asc' }]
    });
  }

  async getPackagesByTemplateId(templateId: string) {
    return prisma.menuPackage.findMany({
      where: { menuTemplateId: templateId },
      include: {
        packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } },
        categorySettings: true
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getPackagesByEventType(eventTypeId: string) {
    const templates = await prisma.menuTemplate.findMany({
      where: { eventTypeId, isActive: true }, select: { id: true }
    });
    if (templates.length === 0) return [];

    return prisma.menuPackage.findMany({
      where: { menuTemplateId: { in: templates.map(t => t.id) } },
      include: {
        menuTemplate: { select: { id: true, name: true, eventType: { select: { id: true, name: true } } } },
        packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } },
        categorySettings: true
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
  }

  async getPackageById(id: string) {
    const pkg = await prisma.menuPackage.findUnique({
      where: { id },
      include: {
        menuTemplate: true,
        packageOptions: { include: { option: true }, orderBy: { displayOrder: 'asc' } },
        categorySettings: true
      }
    });
    if (!pkg) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);
    return pkg;
  }

  async createPackage(data: CreateMenuPackageInput, userId: string) {
    const pkg = await prisma.menuPackage.create({
      data: {
        menuTemplateId: data.menuTemplateId, name: data.name, description: data.description,
        shortDescription: data.shortDescription, pricePerAdult: data.pricePerAdult,
        pricePerChild: data.pricePerChild, pricePerToddler: data.pricePerToddler,
        includedItems: data.includedItems ?? [], minGuests: data.minGuests, maxGuests: data.maxGuests,
        color: data.color, icon: data.icon, badgeText: data.badgeText,
        displayOrder: data.displayOrder ?? 0, isPopular: data.isPopular ?? false,
        isRecommended: data.isRecommended ?? false
      },
      include: { menuTemplate: true, categorySettings: true }
    });

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'MENU_PACKAGE',
      entityId: pkg.id,
      details: { description: `Utworzono pakiet menu: ${pkg.name}`, data: { name: pkg.name, pricePerAdult: pkg.pricePerAdult } }
    });

    return pkg;
  }

  async updatePackage(id: string, data: UpdateMenuPackageInput, userId: string) {
    const currentPackage = await prisma.menuPackage.findUnique({
      where: { id }, select: { name: true, pricePerAdult: true, pricePerChild: true, pricePerToddler: true }
    });
    if (!currentPackage) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);

    const priceChanges: Array<{ fieldName: string; oldValue: number; newValue: number }> = [];

    if (data.pricePerAdult !== undefined && data.pricePerAdult !== currentPackage.pricePerAdult.toNumber()) {
      priceChanges.push({ fieldName: 'pricePerAdult', oldValue: currentPackage.pricePerAdult.toNumber(), newValue: data.pricePerAdult });
    }
    if (data.pricePerChild !== undefined && data.pricePerChild !== currentPackage.pricePerChild.toNumber()) {
      priceChanges.push({ fieldName: 'pricePerChild', oldValue: currentPackage.pricePerChild.toNumber(), newValue: data.pricePerChild });
    }
    if (data.pricePerToddler !== undefined && data.pricePerToddler !== currentPackage.pricePerToddler.toNumber()) {
      priceChanges.push({ fieldName: 'pricePerToddler', oldValue: currentPackage.pricePerToddler.toNumber(), newValue: data.pricePerToddler });
    }

    const updated = await prisma.menuPackage.update({
      where: { id },
      data: {
        name: data.name, description: data.description, shortDescription: data.shortDescription,
        pricePerAdult: data.pricePerAdult, pricePerChild: data.pricePerChild,
        pricePerToddler: data.pricePerToddler, includedItems: data.includedItems,
        minGuests: data.minGuests, maxGuests: data.maxGuests, color: data.color, icon: data.icon,
        badgeText: data.badgeText, displayOrder: data.displayOrder,
        isPopular: data.isPopular, isRecommended: data.isRecommended
      },
      include: { menuTemplate: true, packageOptions: { include: { option: true } }, categorySettings: true }
    });

    for (const change of priceChanges) {
      await prisma.menuPriceHistory.create({
        data: {
          entityType: 'PACKAGE', entityId: id, packageId: id,
          fieldName: change.fieldName, oldValue: change.oldValue, newValue: change.newValue,
          changeReason: data.changeReason, effectiveFrom: new Date()
        }
      });
    }

    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'MENU_PACKAGE',
      entityId: id,
      details: { description: `Zaktualizowano pakiet menu: ${updated.name}`, priceChanges }
    });

    return updated;
  }

  async deletePackage(id: string, userId: string) {
    const existing = await prisma.menuPackage.findUnique({ where: { id }, select: { name: true } });
    if (!existing) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);

    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: { menuData: { path: ['packageId'], equals: id } }
    });
    if (usageCount > 0) throw new Error(MENU_CRUD.CANNOT_DELETE_PACKAGE(usageCount));

    await prisma.menuPackage.delete({ where: { id } });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'MENU_PACKAGE',
      entityId: id,
      details: { description: `Usunięto pakiet menu: ${existing.name}` }
    });
  }

  async reorderPackages(orders: Array<{ packageId: string; displayOrder: number }>) {
    await prisma.$transaction(
      orders.map(({ packageId, displayOrder }) =>
        prisma.menuPackage.update({ where: { id: packageId }, data: { displayOrder } })
      )
    );
    return { success: true, updated: orders.length };
  }

  // ═══════════════════════════ MENU OPTIONS ═══════════════════════════

  async getOptions(filters?: { category?: string; isActive?: boolean; search?: string }) {
    const where: Prisma.MenuOptionWhereInput = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.menuOption.findMany({
      where,
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }]
    });
  }

  async getOptionById(id: string) {
    const option = await prisma.menuOption.findUnique({ where: { id } });
    if (!option) throw new Error(MENU_CRUD.OPTION_NOT_FOUND);
    return option;
  }

  async createOption(data: CreateMenuOptionInput, userId: string) {
    const option = await prisma.menuOption.create({
      data: {
        name: data.name, description: data.description, shortDescription: data.shortDescription,
        category: data.category, priceType: data.priceType, priceAmount: data.priceAmount,
        allowMultiple: data.allowMultiple ?? false, maxQuantity: data.maxQuantity ?? undefined,
        icon: data.icon, imageUrl: data.imageUrl, displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true
      }
    });

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'MENU_OPTION',
      entityId: option.id,
      details: { description: `Utworzono opcję menu: ${option.name}`, data: { name: option.name, category: option.category, priceAmount: option.priceAmount } }
    });

    return option;
  }

  async updateOption(id: string, data: UpdateMenuOptionInput, userId: string) {
    const currentOption = await prisma.menuOption.findUnique({ where: { id }, select: { name: true, priceAmount: true } });
    if (!currentOption) throw new Error(MENU_CRUD.OPTION_NOT_FOUND);

    if (data.priceAmount !== undefined && data.priceAmount !== currentOption.priceAmount.toNumber()) {
      await prisma.menuPriceHistory.create({
        data: {
          entityType: 'OPTION', entityId: id, optionId: id,
          fieldName: 'priceAmount', oldValue: currentOption.priceAmount.toNumber(),
          newValue: data.priceAmount, changeReason: data.changeReason, effectiveFrom: new Date()
        }
      });
    }

    const option = await prisma.menuOption.update({
      where: { id },
      data: {
        name: data.name, description: data.description, shortDescription: data.shortDescription,
        category: data.category, priceType: data.priceType, priceAmount: data.priceAmount,
        allowMultiple: data.allowMultiple, maxQuantity: data.maxQuantity ?? undefined, icon: data.icon,
        imageUrl: data.imageUrl, displayOrder: data.displayOrder, isActive: data.isActive
      }
    });

    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'MENU_OPTION',
      entityId: id,
      details: { description: `Zaktualizowano opcję menu: ${option.name}` }
    });

    return option;
  }

  async deleteOption(id: string, userId: string) {
    const existing = await prisma.menuOption.findUnique({ where: { id }, select: { name: true } });
    if (!existing) throw new Error(MENU_CRUD.OPTION_NOT_FOUND);

    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: { menuData: { path: ['selectedOptions'], array_contains: [{ optionId: id }] } }
    });
    if (usageCount > 0) throw new Error(MENU_CRUD.CANNOT_DELETE_OPTION(usageCount));
    await prisma.menuPackageOption.deleteMany({ where: { optionId: id } });

    await prisma.menuOption.delete({ where: { id } });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'MENU_OPTION',
      entityId: id,
      details: { description: `Usunięto opcję menu: ${existing.name}` }
    });
  }

  // ═══════════════════════════ PACKAGE-OPTION RELATIONSHIPS ═══════════════════════════

  async assignOptionsToPackage(packageId: string, data: AssignOptionsToPackageInput) {
    await prisma.menuPackageOption.deleteMany({ where: { packageId } });
    await prisma.menuPackageOption.createMany({
      data: data.options.map((opt, index) => ({
        packageId, optionId: opt.optionId, customPrice: opt.customPrice,
        isRequired: opt.isRequired ?? false, isDefault: opt.isDefault ?? false,
        displayOrder: opt.displayOrder ?? index
      }))
    });
    return this.getPackageById(packageId);
  }

  async getPriceHistory(entityType: 'PACKAGE' | 'OPTION', entityId: string) {
    return prisma.menuPriceHistory.findMany({
      where: { entityType, entityId },
      orderBy: { effectiveFrom: 'desc' }
    });
  }
}

export const menuService = new MenuService();
