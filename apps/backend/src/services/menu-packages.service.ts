import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySettingInput {
  categoryId: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  isEnabled: boolean;
  displayOrder: number;
  customLabel?: string;
}

interface CreatePackageInput {
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler?: number;
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number;
  maxGuests?: number;
  categorySettings?: CategorySettingInput[];
}

interface UpdatePackageInput extends Partial<CreatePackageInput> {}

class MenuPackagesService {
  /**
   * Pobierz wszystkie pakiety
   */
  async findAll(menuTemplateId?: string) {
    const where: Prisma.MenuPackageWhereInput = {};
    
    if (menuTemplateId) {
      where.menuTemplateId = menuTemplateId;
    }
    
    return prisma.menuPackage.findMany({
      where,
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
        categorySettings: {
          include: {
            category: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        packageOptions: {
          include: {
            option: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  /**
   * Pobierz pakiet po ID
   */
  async findById(id: string) {
    return prisma.menuPackage.findUnique({
      where: { id },
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
        categorySettings: {
          include: {
            category: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        packageOptions: {
          include: {
            option: true,
          },
        },
      },
    });
  }

  /**
   * Utwórz nowy pakiet
   */
  async create(data: CreatePackageInput) {
    const { categorySettings, ...packageData } = data;
    
    return prisma.$transaction(async (tx) => {
      // Utwórz pakiet
      const newPackage = await tx.menuPackage.create({
        data: {
          ...packageData,
          pricePerToddler: packageData.pricePerToddler ?? 0,
          displayOrder: packageData.displayOrder ?? 0,
          isPopular: packageData.isPopular ?? false,
          isRecommended: packageData.isRecommended ?? false,
          includedItems: packageData.includedItems ?? [],
        },
      });

      // Dodaj categorySettings jeśli są
      if (categorySettings && categorySettings.length > 0) {
        await tx.packageCategorySettings.createMany({
          data: categorySettings.map((cs) => ({
            packageId: newPackage.id,
            categoryId: cs.categoryId,
            minSelect: cs.minSelect,
            maxSelect: cs.maxSelect,
            isRequired: cs.isRequired,
            isEnabled: cs.isEnabled,
            displayOrder: cs.displayOrder,
            customLabel: cs.customLabel,
          })),
        });
      }

      // Pobierz kompletny pakiet z relacjami
      return tx.menuPackage.findUnique({
        where: { id: newPackage.id },
        include: {
          menuTemplate: {
            include: {
              eventType: true,
            },
          },
          categorySettings: {
            include: {
              category: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Aktualizuj pakiet
   */
  async update(id: string, data: UpdatePackageInput) {
    const { categorySettings, ...packageData } = data;
    
    return prisma.$transaction(async (tx) => {
      // Aktualizuj podstawowe dane pakietu
      const updatedPackage = await tx.menuPackage.update({
        where: { id },
        data: packageData,
      });

      // Jeśli są categorySettings, zsynchronizuj je
      if (categorySettings) {
        // Usuń stare
        await tx.packageCategorySettings.deleteMany({
          where: { packageId: id },
        });

        // Dodaj nowe
        if (categorySettings.length > 0) {
          await tx.packageCategorySettings.createMany({
            data: categorySettings.map((cs) => ({
              packageId: id,
              categoryId: cs.categoryId,
              minSelect: cs.minSelect,
              maxSelect: cs.maxSelect,
              isRequired: cs.isRequired,
              isEnabled: cs.isEnabled,
              displayOrder: cs.displayOrder,
              customLabel: cs.customLabel,
            })),
          });
        }
      }

      // Pobierz zaktualizowany pakiet z relacjami
      return tx.menuPackage.findUnique({
        where: { id },
        include: {
          menuTemplate: {
            include: {
              eventType: true,
            },
          },
          categorySettings: {
            include: {
              category: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Usuń pakiet
   */
  async delete(id: string) {
    return prisma.menuPackage.delete({
      where: { id },
    });
  }
}

export const menuPackagesService = new MenuPackagesService();
