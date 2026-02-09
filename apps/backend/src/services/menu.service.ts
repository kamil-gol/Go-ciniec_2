/**
 * Menu Service
 * 
 * Handles all business logic for menu management:
 * - Menu templates (event-specific menus)
 * - Menu packages (pricing tiers)
 * - Menu options (add-on services)
 * - Package-option relationships
 */

import { PrismaClient, Prisma } from '@prisma/client';
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

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// MENU TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

export class MenuService {
  
  /**
   * Get all menu templates with optional filters
   */
  async getMenuTemplates(filters?: {
    eventTypeId?: string;
    isActive?: boolean;
    date?: Date;
  }) {
    const where: Prisma.MenuTemplateWhereInput = {};

    if (filters?.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.date) {
      where.AND = [
        { validFrom: { lte: filters.date } },
        {
          OR: [
            { validTo: null },
            { validTo: { gte: filters.date } }
          ]
        }
      ];
    }

    return await prisma.menuTemplate.findMany({
      where,
      include: {
        eventType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        packages: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            pricePerAdult: true,
            pricePerChild: true,
            isPopular: true,
            isRecommended: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Get single menu template by ID
   */
  async getMenuTemplateById(id: string) {
    const template = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        eventType: true,
        packages: {
          orderBy: { displayOrder: 'asc' },
          include: {
            packageOptions: {
              include: {
                option: true
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!template) {
      throw new Error('Menu template not found');
    }

    return template;
  }

  /**
   * Get active menu template for event type on specific date
   */
  async getActiveMenuForEventType(eventTypeId: string, date: Date = new Date()) {
    const template = await prisma.menuTemplate.findFirst({
      where: {
        eventTypeId,
        isActive: true,
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } }
        ]
      },
      include: {
        eventType: true,
        packages: {
          orderBy: { displayOrder: 'asc' },
          include: {
            packageOptions: {
              include: {
                option: true
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!template) {
      throw new Error(`No active menu found for event type ${eventTypeId} on ${date.toISOString()}`);
    }

    return template;
  }

  /**
   * Create new menu template
   */
  async createMenuTemplate(data: CreateMenuTemplateInput) {
    return await prisma.menuTemplate.create({
      data: {
        eventTypeId: data.eventTypeId,
        name: data.name,
        description: data.description,
        variant: data.variant,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
        imageUrl: data.imageUrl
      },
      include: {
        eventType: true
      }
    });
  }

  /**
   * Update menu template
   */
  async updateMenuTemplate(id: string, data: UpdateMenuTemplateInput) {
    return await prisma.menuTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        variant: data.variant,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        imageUrl: data.imageUrl
      },
      include: {
        eventType: true,
        packages: true
      }
    });
  }

  /**
   * Delete menu template
   */
  async deleteMenuTemplate(id: string) {
    // Check if template is used in any reservations
    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: {
        menuData: {
          path: ['templateId'],
          equals: id
        }
      }
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete menu template. It is used in ${usageCount} reservation(s).`);
    }

    return await prisma.menuTemplate.delete({
      where: { id }
    });
  }

  /**
   * Duplicate menu template with all packages and options
   */
  async duplicateMenuTemplate(
    id: string, 
    newData: {
      name: string;
      variant?: string;
      validFrom: Date;
      validTo?: Date;
    }
  ) {
    const original = await this.getMenuTemplateById(id);

    // Create new template
    const newTemplate = await prisma.menuTemplate.create({
      data: {
        eventTypeId: original.eventTypeId,
        name: newData.name,
        description: original.description,
        variant: newData.variant ?? original.variant,
        validFrom: newData.validFrom,
        validTo: newData.validTo,
        isActive: true,
        displayOrder: original.displayOrder
      }
    });

    // Duplicate packages
    for (const pkg of original.packages) {
      const newPackage = await prisma.menuPackage.create({
        data: {
          menuTemplateId: newTemplate.id,
          name: pkg.name,
          description: pkg.description,
          shortDescription: pkg.shortDescription,
          pricePerAdult: pkg.pricePerAdult,
          pricePerChild: pkg.pricePerChild,
          pricePerToddler: pkg.pricePerToddler,
          includedItems: pkg.includedItems,
          minGuests: pkg.minGuests,
          maxGuests: pkg.maxGuests,
          color: pkg.color,
          icon: pkg.icon,
          badgeText: pkg.badgeText,
          imageUrl: pkg.imageUrl,
          displayOrder: pkg.displayOrder,
          isPopular: pkg.isPopular,
          isRecommended: pkg.isRecommended
        }
      });

      // Duplicate package-option relationships
      for (const pkgOpt of pkg.packageOptions) {
        await prisma.menuPackageOption.create({
          data: {
            packageId: newPackage.id,
            optionId: pkgOpt.optionId,
            customPrice: pkgOpt.customPrice,
            isRequired: pkgOpt.isRequired,
            isDefault: pkgOpt.isDefault,
            displayOrder: pkgOpt.displayOrder
          }
        });
      }
    }

    return await this.getMenuTemplateById(newTemplate.id);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MENU PACKAGES
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get all packages for a menu template
   */
  async getPackagesByTemplateId(templateId: string) {
    return await prisma.menuPackage.findMany({
      where: { menuTemplateId: templateId },
      include: {
        packageOptions: {
          include: {
            option: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * Get single package by ID
   */
  async getPackageById(id: string) {
    const pkg = await prisma.menuPackage.findUnique({
      where: { id },
      include: {
        menuTemplate: true,
        packageOptions: {
          include: {
            option: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    return pkg;
  }

  /**
   * Create new package
   */
  async createPackage(data: CreateMenuPackageInput) {
    return await prisma.menuPackage.create({
      data: {
        menuTemplateId: data.menuTemplateId,
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        pricePerAdult: data.pricePerAdult,
        pricePerChild: data.pricePerChild,
        pricePerToddler: data.pricePerToddler,
        includedItems: data.includedItems ?? [],
        minGuests: data.minGuests,
        maxGuests: data.maxGuests,
        color: data.color,
        icon: data.icon,
        badgeText: data.badgeText,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder ?? 0,
        isPopular: data.isPopular ?? false,
        isRecommended: data.isRecommended ?? false
      },
      include: {
        menuTemplate: true
      }
    });
  }

  /**
   * Update package
   */
  async updatePackage(id: string, data: UpdateMenuPackageInput) {
    const currentPackage = await prisma.menuPackage.findUnique({
      where: { id },
      select: { pricePerAdult: true, pricePerChild: true, pricePerToddler: true }
    });

    if (!currentPackage) {
      throw new Error('Package not found');
    }

    // Track price changes
    const priceChanges: Array<{
      fieldName: string;
      oldValue: number;
      newValue: number;
    }> = [];

    if (data.pricePerAdult !== undefined && data.pricePerAdult !== currentPackage.pricePerAdult.toNumber()) {
      priceChanges.push({
        fieldName: 'pricePerAdult',
        oldValue: currentPackage.pricePerAdult.toNumber(),
        newValue: data.pricePerAdult
      });
    }

    if (data.pricePerChild !== undefined && data.pricePerChild !== currentPackage.pricePerChild.toNumber()) {
      priceChanges.push({
        fieldName: 'pricePerChild',
        oldValue: currentPackage.pricePerChild.toNumber(),
        newValue: data.pricePerChild
      });
    }

    if (data.pricePerToddler !== undefined && data.pricePerToddler !== currentPackage.pricePerToddler.toNumber()) {
      priceChanges.push({
        fieldName: 'pricePerToddler',
        oldValue: currentPackage.pricePerToddler.toNumber(),
        newValue: data.pricePerToddler
      });
    }

    // Update package
    const updated = await prisma.menuPackage.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        pricePerAdult: data.pricePerAdult,
        pricePerChild: data.pricePerChild,
        pricePerToddler: data.pricePerToddler,
        includedItems: data.includedItems,
        minGuests: data.minGuests,
        maxGuests: data.maxGuests,
        color: data.color,
        icon: data.icon,
        badgeText: data.badgeText,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder,
        isPopular: data.isPopular,
        isRecommended: data.isRecommended
      },
      include: {
        menuTemplate: true,
        packageOptions: {
          include: { option: true }
        }
      }
    });

    // Log price changes
    for (const change of priceChanges) {
      await prisma.menuPriceHistory.create({
        data: {
          entityType: 'PACKAGE',
          entityId: id,
          packageId: id,
          fieldName: change.fieldName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changeReason: data.changeReason,
          effectiveFrom: new Date()
        }
      });
    }

    return updated;
  }

  /**
   * Delete package
   */
  async deletePackage(id: string) {
    // Check if package is used in any reservations
    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: {
        menuData: {
          path: ['packageId'],
          equals: id
        }
      }
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete package. It is used in ${usageCount} reservation(s).`);
    }

    return await prisma.menuPackage.delete({
      where: { id }
    });
  }

  /**
   * Reorder packages
   */
  async reorderPackages(orders: Array<{ packageId: string; displayOrder: number }>) {
    const updates = orders.map(({ packageId, displayOrder }) =>
      prisma.menuPackage.update({
        where: { id: packageId },
        data: { displayOrder }
      })
    );

    await prisma.$transaction(updates);

    return { success: true, updated: orders.length };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MENU OPTIONS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get all options with optional filters
   */
  async getOptions(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.MenuOptionWhereInput = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return await prisma.menuOption.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Get single option by ID
   */
  async getOptionById(id: string) {
    const option = await prisma.menuOption.findUnique({
      where: { id }
    });

    if (!option) {
      throw new Error('Option not found');
    }

    return option;
  }

  /**
   * Create new option
   */
  async createOption(data: CreateMenuOptionInput) {
    return await prisma.menuOption.create({
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        priceType: data.priceType,
        priceAmount: data.priceAmount,
        allowMultiple: data.allowMultiple ?? false,
        maxQuantity: data.maxQuantity,
        icon: data.icon,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true
      }
    });
  }

  /**
   * Update option
   */
  async updateOption(id: string, data: UpdateMenuOptionInput) {
    const currentOption = await prisma.menuOption.findUnique({
      where: { id },
      select: { priceAmount: true }
    });

    if (!currentOption) {
      throw new Error('Option not found');
    }

    // Track price change
    if (data.priceAmount !== undefined && data.priceAmount !== currentOption.priceAmount.toNumber()) {
      await prisma.menuPriceHistory.create({
        data: {
          entityType: 'OPTION',
          entityId: id,
          optionId: id,
          fieldName: 'priceAmount',
          oldValue: currentOption.priceAmount.toNumber(),
          newValue: data.priceAmount,
          changeReason: data.changeReason,
          effectiveFrom: new Date()
        }
      });
    }

    return await prisma.menuOption.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        priceType: data.priceType,
        priceAmount: data.priceAmount,
        allowMultiple: data.allowMultiple,
        maxQuantity: data.maxQuantity,
        icon: data.icon,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder,
        isActive: data.isActive
      }
    });
  }

  /**
   * Delete option
   */
  async deleteOption(id: string) {
    // Check if option is used in any reservations
    const usageCount = await prisma.reservationMenuSnapshot.count({
      where: {
        menuData: {
          path: ['selectedOptions'],
          array_contains: [{ optionId: id }]
        }
      }
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete option. It is used in ${usageCount} reservation(s).`);
    }

    // Delete package-option relationships
    await prisma.menuPackageOption.deleteMany({
      where: { optionId: id }
    });

    return await prisma.menuOption.delete({
      where: { id }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PACKAGE-OPTION RELATIONSHIPS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Assign options to package
   */
  async assignOptionsToPackage(packageId: string, data: AssignOptionsToPackageInput) {
    // Remove existing assignments
    await prisma.menuPackageOption.deleteMany({
      where: { packageId }
    });

    // Create new assignments
    const assignments = data.options.map((opt, index) => ({
      packageId,
      optionId: opt.optionId,
      customPrice: opt.customPrice,
      isRequired: opt.isRequired ?? false,
      isDefault: opt.isDefault ?? false,
      displayOrder: opt.displayOrder ?? index
    }));

    await prisma.menuPackageOption.createMany({
      data: assignments
    });

    return await this.getPackageById(packageId);
  }

  /**
   * Get price history for entity
   */
  async getPriceHistory(entityType: 'PACKAGE' | 'OPTION', entityId: string) {
    return await prisma.menuPriceHistory.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: { effectiveFrom: 'desc' }
    });
  }
}

export const menuService = new MenuService();
