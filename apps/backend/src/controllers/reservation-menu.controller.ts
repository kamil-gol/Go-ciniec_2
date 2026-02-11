/**
 * Reservation Menu Controller (Express)
 * 
 * Handles menu assignment to reservations
 */

import { Request, Response } from 'express';
import { PrismaClient, Decimal } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// === Validation Schemas ===

const SelectedOptionSchema = z.object({
  optionId: z.string().uuid(),
  quantity: z.number().int().positive(),
  customPrice: z.number().optional(),
});

const SaveMenuSchema = z.object({
  templateId: z.string().uuid().optional(), // Frontend sends this, but we don't use it
  packageId: z.string().uuid(),
  adults: z.number().int().min(0),
  children: z.number().int().min(0).default(0),
  toddlers: z.number().int().min(0).default(0),
  selectedOptions: z.array(SelectedOptionSchema).optional().default([]),
});

// === Utilities ===

function toNumber(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

// Build price breakdown from menuSnapshot
function buildPriceBreakdown(menuData: any) {
  const guests = menuData.guests;
  const pricing = menuData.pricing;
  const options = menuData.options || [];

  return {
    packageCost: {
      adults: {
        count: guests.adults,
        priceEach: menuData.package.pricePerAdult,
        total: menuData.package.pricePerAdult * guests.adults,
      },
      children: {
        count: guests.children,
        priceEach: menuData.package.pricePerChild,
        total: menuData.package.pricePerChild * guests.children,
      },
      toddlers: {
        count: guests.toddlers,
        priceEach: menuData.package.pricePerToddler,
        total: menuData.package.pricePerToddler * guests.toddlers,
      },
      subtotal: pricing.packagePrice,
    },
    optionsCost: options.map((opt: any) => ({
      option: opt.name,
      priceType: opt.priceType,
      priceEach: opt.priceAmount,
      quantity: opt.quantity,
      total: opt.calculatedPrice,
    })),
    optionsSubtotal: pricing.optionsPrice,
    totalMenuPrice: pricing.totalPrice,
  };
}

// === Controllers ===

/**
 * POST /api/reservations/:reservationId/menu
 * Save menu selection to reservation
 */
export async function saveReservationMenu(req: Request, res: Response) {
  try {
    const { reservationId } = req.params;

    // Validate request body
    const validation = SaveMenuSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const dto = validation.data;
    const totalGuests = dto.adults + dto.children + dto.toddlers;

    if (totalGuests === 0) {
      return res.status(400).json({ error: 'At least one guest is required' });
    }

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Fetch package
    const menuPackage = await prisma.menuPackage.findUnique({
      where: { id: dto.packageId },
      include: {
        menuTemplate: {
          include: { eventType: true },
        },
      },
    });

    if (!menuPackage) {
      return res.status(404).json({ error: 'Menu package not found' });
    }

    // Calculate package price
    const pricePerAdult = toNumber(menuPackage.pricePerAdult);
    const pricePerChild = toNumber(menuPackage.pricePerChild);
    const pricePerToddler = toNumber(menuPackage.pricePerToddler);

    const packagePrice = 
      (pricePerAdult * dto.adults) +
      (pricePerChild * dto.children) +
      (pricePerToddler * dto.toddlers);

    // Calculate options price
    let optionsPrice = 0;
    const optionsDetails: any[] = [];

    if (dto.selectedOptions.length > 0) {
      const optionIds = dto.selectedOptions.map(opt => opt.optionId);

      const options = await prisma.menuOption.findMany({
        where: {
          id: { in: optionIds },
          isActive: true,
        },
      });

      for (const selectedOption of dto.selectedOptions) {
        const option = options.find(opt => opt.id === selectedOption.optionId);

        if (!option) {
          return res.status(400).json({
            error: `Option ${selectedOption.optionId} not found or inactive`,
          });
        }

        const basePrice = selectedOption.customPrice ?? toNumber(option.priceAmount);
        let calculatedPrice = 0;

        switch (option.priceType) {
          case 'PER_PERSON':
            calculatedPrice = basePrice * totalGuests * selectedOption.quantity;
            break;

          case 'PER_ADULT':
            calculatedPrice = basePrice * dto.adults * selectedOption.quantity;
            break;

          case 'PER_CHILD':
            calculatedPrice = basePrice * dto.children * selectedOption.quantity;
            break;

          case 'PER_GUEST_TYPE':
            const adultPrice = basePrice * dto.adults;
            const childPrice = basePrice * 0.5 * dto.children;
            calculatedPrice = (adultPrice + childPrice) * selectedOption.quantity;
            break;

          case 'FLAT_FEE':
          default:
            calculatedPrice = basePrice * selectedOption.quantity;
            break;
        }

        optionsDetails.push({
          optionId: option.id,
          name: option.name,
          category: option.category,
          priceType: option.priceType,
          priceAmount: basePrice,
          quantity: selectedOption.quantity,
          calculatedPrice: roundToTwo(calculatedPrice),
        });

        optionsPrice += calculatedPrice;
      }
    }

    const totalMenuPrice = packagePrice + optionsPrice;

    // Build menu data JSON
    const menuData = {
      package: {
        id: menuPackage.id,
        name: menuPackage.name,
        description: menuPackage.description,
        pricePerAdult,
        pricePerChild,
        pricePerToddler,
        includedItems: menuPackage.includedItems,
      },
      guests: {
        adults: dto.adults,
        children: dto.children,
        toddlers: dto.toddlers,
        total: totalGuests,
      },
      options: optionsDetails,
      pricing: {
        packagePrice: roundToTwo(packagePrice),
        optionsPrice: roundToTwo(optionsPrice),
        totalPrice: roundToTwo(totalMenuPrice),
        pricePerGuest: roundToTwo(totalMenuPrice / totalGuests),
      },
      template: {
        id: menuPackage.menuTemplate.id,
        name: menuPackage.menuTemplate.name,
        variant: menuPackage.menuTemplate.variant,
        eventType: menuPackage.menuTemplate.eventType.name,
      },
    };

    // Upsert menu snapshot
    const menuSnapshot = await prisma.reservationMenuSnapshot.upsert({
      where: { reservationId },
      create: {
        reservationId,
        menuData,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: dto.packageId,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: dto.adults,
        childrenCount: dto.children,
        toddlersCount: dto.toddlers,
      },
      update: {
        menuData,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: dto.packageId,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: dto.adults,
        childrenCount: dto.children,
        toddlersCount: dto.toddlers,
      },
    });

    // Build price breakdown
    const priceBreakdown = buildPriceBreakdown(menuData);

    // Return same structure as GET endpoint
    res.status(200).json({
      success: true,
      message: 'Menu saved successfully',
      data: {
        snapshot: {
          id: menuSnapshot.id,
          reservationId: menuSnapshot.reservationId,
          menuData,
          adultsCount: menuSnapshot.adultsCount,
          childrenCount: menuSnapshot.childrenCount,
          toddlersCount: menuSnapshot.toddlersCount,
          snapshotDate: menuSnapshot.selectedAt?.toISOString() || new Date().toISOString(),
          createdAt: menuSnapshot.createdAt.toISOString(),
          updatedAt: menuSnapshot.updatedAt.toISOString(),
        },
        priceBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error saving reservation menu:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /api/reservations/:reservationId/menu
 * Get menu selection for reservation
 */
export async function getReservationMenu(req: Request, res: Response) {
  try {
    const { reservationId } = req.params;

    const menuSnapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId },
    });

    if (!menuSnapshot) {
      return res.status(404).json({ 
        error: 'Menu not found for this reservation',
        hasMenu: false,
      });
    }

    const menuData = menuSnapshot.menuData as any;
    const priceBreakdown = buildPriceBreakdown(menuData);

    res.json({
      success: true,
      data: {
        snapshot: {
          id: menuSnapshot.id,
          reservationId: menuSnapshot.reservationId,
          menuData: menuSnapshot.menuData,
          adultsCount: menuSnapshot.adultsCount,
          childrenCount: menuSnapshot.childrenCount,
          toddlersCount: menuSnapshot.toddlersCount,
          snapshotDate: menuSnapshot.selectedAt?.toISOString() || new Date().toISOString(),
          createdAt: menuSnapshot.createdAt.toISOString(),
          updatedAt: menuSnapshot.updatedAt.toISOString(),
        },
        priceBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error getting reservation menu:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * DELETE /api/reservations/:reservationId/menu
 * Remove menu selection from reservation
 */
export async function deleteReservationMenu(req: Request, res: Response) {
  try {
    const { reservationId } = req.params;

    const menuSnapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId },
    });

    if (!menuSnapshot) {
      return res.status(404).json({ error: 'Menu not found for this reservation' });
    }

    await prisma.reservationMenuSnapshot.delete({
      where: { reservationId },
    });

    res.json({ 
      success: true,
      message: 'Menu deleted successfully',
      reservationId,
    });
  } catch (error: any) {
    console.error('Error deleting reservation menu:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * PUT /api/reservations/:reservationId/menu
 * Update menu selection (alias for POST)
 */
export const updateReservationMenu = saveReservationMenu;
