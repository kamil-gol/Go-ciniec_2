import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MenuOptionFilters {
  category?: string;
  priceType?: string;
  isActive?: boolean;
}

interface CreateMenuOptionInput {
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  priceType: string;
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

interface UpdateMenuOptionInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string;
  priceType?: string;
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Get all menu options with optional filtering
 */
export async function getAllMenuOptions(filters: MenuOptionFilters = {}) {
  const where: any = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.priceType) {
    where.priceType = filters.priceType;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  return await prisma.menuOption.findMany({
    where,
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get single menu option by ID
 */
export async function getMenuOptionById(id: string) {
  return await prisma.menuOption.findUnique({
    where: { id },
  });
}

/**
 * Create new menu option
 */
export async function createMenuOption(data: CreateMenuOptionInput) {
  return await prisma.menuOption.create({
    data: {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category,
      priceType: data.priceType,
      priceAmount: data.priceAmount || 0,
      allowMultiple: data.allowMultiple || false,
      maxQuantity: data.maxQuantity || 1,
      icon: data.icon,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl,
      isActive: data.isActive !== undefined ? data.isActive : true,
      displayOrder: data.displayOrder || 0,
    },
  });
}

/**
 * Update menu option
 */
export async function updateMenuOption(
  id: string,
  data: UpdateMenuOptionInput
) {
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
      thumbnailUrl: data.thumbnailUrl,
      isActive: data.isActive,
      displayOrder: data.displayOrder,
    },
  });
}

/**
 * Delete menu option
 */
export async function deleteMenuOption(id: string) {
  return await prisma.menuOption.delete({
    where: { id },
  });
}
