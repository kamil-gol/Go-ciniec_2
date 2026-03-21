import { CateringPriceType, Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '@/lib/prisma';

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

export interface CreateCateringTemplateDto {
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCateringTemplateDto {
  name?: string;
  description?: string | null;
  slug?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CreateCateringPackageDto {
  name: string;
  description?: string;
  shortDescription?: string;
  priceType?: CateringPriceType;
  basePrice: number;
  tieredPricing?: Record<string, unknown>;
  badgeText?: string;
  isPopular?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  minGuests?: number;
  maxGuests?: number;
}

export interface UpdateCateringPackageDto {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  priceType?: CateringPriceType;
  basePrice?: number;
  /** null = clear the field (maps to Prisma.JsonNull internally) */
  tieredPricing?: Record<string, unknown> | null;
  badgeText?: string | null;
  isPopular?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  minGuests?: number | null;
  maxGuests?: number | null;
}

export interface CreateCateringSectionDto {
  categoryId: string;
  name?: string;
  description?: string;
  /** Wartości ćwiartkowe: 0.25, 0.5, 0.75, 1.0, 1.25... */
  minSelect?: number;
  /** Wartości ćwiartkowe: 0.25, 0.5, 0.75, 1.0, 1.25... null = bez limitu */
  maxSelect?: number | null;
  isRequired?: boolean;
  displayOrder?: number;
}

export interface UpdateCateringSectionDto {
  name?: string | null;
  description?: string | null;
  /** Wartości ćwiartkowe: 0.25, 0.5, 0.75, 1.0, 1.25... */
  minSelect?: number;
  /** Wartości ćwiartkowe: 0.25, 0.5, 0.75, 1.0, 1.25... null = wyczyść limit */
  maxSelect?: number | null;
  isRequired?: boolean;
  displayOrder?: number;
}

export interface CreateCateringSectionOptionDto {
  dishId: string;
  customPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface UpdateCateringSectionOptionDto {
  customPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
}

// ═════════════════════════════════════════════════════════════════
// CATERING TEMPLATES
// ═════════════════════════════════════════════════════════════════

export async function getCateringTemplates(includeInactive = false) {
  return prisma.cateringTemplate.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      packages: {
        where: includeInactive ? undefined : { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          sections: {
            orderBy: { displayOrder: 'asc' },
            include: {
              category: true,
              options: {
                orderBy: { displayOrder: 'asc' },
                include: { dish: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCateringTemplateById(id: string) {
  const template = await prisma.cateringTemplate.findUnique({
    where: { id },
    include: {
      packages: {
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          sections: {
            orderBy: { displayOrder: 'asc' },
            include: {
              category: true,
              options: {
                orderBy: { displayOrder: 'asc' },
                include: { dish: true },
              },
            },
          },
        },
      },
    },
  });
  if (!template) throw new AppError('Szablon cateringu nie istnieje', 404);
  return template;
}

export async function createCateringTemplate(data: CreateCateringTemplateDto) {
  const existing = await prisma.cateringTemplate.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(`Szablon z slug "${data.slug}" już istnieje`, 409);

  return prisma.cateringTemplate.create({ data });
}

export async function updateCateringTemplate(id: string, data: UpdateCateringTemplateDto) {
  await getCateringTemplateById(id);

  if (data.slug) {
    const conflict = await prisma.cateringTemplate.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (conflict) throw new AppError(`Slug "${data.slug}" jest już zajęty`, 409);
  }

  return prisma.cateringTemplate.update({ where: { id }, data });
}

export async function deleteCateringTemplate(id: string) {
  await getCateringTemplateById(id);
  return prisma.cateringTemplate.delete({ where: { id } });
}

// ═════════════════════════════════════════════════════════════════
// CATERING PACKAGES
// ═════════════════════════════════════════════════════════════════

export async function getCateringPackageById(id: string) {
  const pkg = await prisma.cateringPackage.findUnique({
    where: { id },
    include: {
      template: true,
      sections: {
        orderBy: { displayOrder: 'asc' },
        include: {
          category: true,
          options: {
            orderBy: { displayOrder: 'asc' },
            include: { dish: true },
          },
        },
      },
    },
  });
  if (!pkg) throw new AppError('Pakiet cateringu nie istnieje', 404);
  return pkg;
}

export async function createCateringPackage(templateId: string, data: CreateCateringPackageDto) {
  const template = await prisma.cateringTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new AppError('Szablon cateringu nie istnieje', 404);

  return prisma.cateringPackage.create({
    data: {
      ...data,
      templateId,
      tieredPricing: (data.tieredPricing ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
    include: {
      sections: {
        include: { category: true, options: { include: { dish: true } } },
      },
    },
  });
}

export async function updateCateringPackage(id: string, data: UpdateCateringPackageDto) {
  await getCateringPackageById(id);

  const { tieredPricing, ...rest } = data;

  return prisma.cateringPackage.update({
    where: { id },
    data: {
      ...rest,
      ...(tieredPricing !== undefined && {
        tieredPricing: (
          tieredPricing === null ? Prisma.JsonNull : tieredPricing
        ) as Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue,
      }),
    },
    include: {
      sections: {
        include: { category: true, options: { include: { dish: true } } },
      },
    },
  });
}

export async function deleteCateringPackage(id: string) {
  await getCateringPackageById(id);
  return prisma.cateringPackage.delete({ where: { id } });
}

// ═════════════════════════════════════════════════════════════════
// CATERING PACKAGE SECTIONS
// ═════════════════════════════════════════════════════════════════

export async function createCateringSection(packageId: string, data: CreateCateringSectionDto) {
  const pkg = await prisma.cateringPackage.findUnique({ where: { id: packageId } });
  if (!pkg) throw new AppError('Pakiet cateringu nie istnieje', 404);

  const existing = await prisma.cateringPackageSection.findUnique({
    where: { packageId_categoryId: { packageId, categoryId: data.categoryId } },
  });
  if (existing) throw new AppError('Sekcja dla tej kategorii już istnieje w pakiecie', 409);

  const { maxSelect, ...rest } = data;

  return prisma.cateringPackageSection.create({
    data: {
      ...rest,
      packageId,
      // null lub undefined = brak limitu (pole nullable w bazie)
      ...(maxSelect !== undefined && { maxSelect: maxSelect ?? null }),
    },
    include: { category: true, options: { include: { dish: true } } },
  });
}

export async function updateCateringSection(sectionId: string, data: UpdateCateringSectionDto) {
  const section = await prisma.cateringPackageSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new AppError('Sekcja cateringu nie istnieje', 404);

  const { maxSelect, ...rest } = data;

  return prisma.cateringPackageSection.update({
    where: { id: sectionId },
    data: {
      ...rest,
      // Jeśli maxSelect został przekazany (nawet jako null) — zapisz go
      // null w bazie = brak limitu
      ...(maxSelect !== undefined && { maxSelect: maxSelect ?? null }),
    },
    include: { category: true, options: { include: { dish: true } } },
  });
}

export async function deleteCateringSection(sectionId: string) {
  const section = await prisma.cateringPackageSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new AppError('Sekcja cateringu nie istnieje', 404);
  return prisma.cateringPackageSection.delete({ where: { id: sectionId } });
}

// ═════════════════════════════════════════════════════════════════
// CATERING SECTION OPTIONS
// ═════════════════════════════════════════════════════════════════

export async function addOptionToSection(sectionId: string, data: CreateCateringSectionOptionDto) {
  const section = await prisma.cateringPackageSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new AppError('Sekcja cateringu nie istnieje', 404);

  const dish = await prisma.dish.findUnique({ where: { id: data.dishId } });
  if (!dish) throw new AppError('Danie nie istnieje', 404);

  const existing = await prisma.cateringSectionOption.findUnique({
    where: { sectionId_dishId: { sectionId, dishId: data.dishId } },
  });
  if (existing) throw new AppError('To danie jest już dodane do tej sekcji', 409);

  return prisma.cateringSectionOption.create({
    data: { ...data, sectionId },
    include: { dish: true },
  });
}

export async function updateSectionOption(
  optionId: string,
  data: UpdateCateringSectionOptionDto,
) {
  const option = await prisma.cateringSectionOption.findUnique({ where: { id: optionId } });
  if (!option) throw new AppError('Opcja sekcji nie istnieje', 404);

  return prisma.cateringSectionOption.update({
    where: { id: optionId },
    data,
    include: { dish: true },
  });
}

export async function removeOptionFromSection(optionId: string) {
  const option = await prisma.cateringSectionOption.findUnique({ where: { id: optionId } });
  if (!option) throw new AppError('Opcja sekcji nie istnieje', 404);
  return prisma.cateringSectionOption.delete({ where: { id: optionId } });
}
