/**
 * Menu Calculator Controller (Express)
 *
 * Handles menu price calculation requests.
 * NOTE: MenuOption model removed from Prisma. Options functionality
 * is now handled via ServiceExtras. The option-related endpoints
 * are kept as stubs returning 410 Gone.
 */

import { Request, Response } from 'express';
import prisma from '@/lib/prisma';
import { logger } from '../services/logger.service';

interface CalculatePriceRequest {
  packageId: string;
  adults: number;
  children: number;
  toddlers: number;
}

// === Utilities ===
function toNumber(decimal: { toString(): string }): number {
  return parseFloat(decimal.toString());
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * POST /api/menu-calculator/calculate
 * Calculate menu price (package only — options removed)
 */
export async function calculatePrice(req: Request, res: Response) {
  try {
    const dto: CalculatePriceRequest = req.body;

    // Validation
    if (!dto.packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const { adults = 0, children = 0, toddlers = 0 } = dto;
    const totalGuests = adults + children + toddlers;

    if (totalGuests === 0) {
      return res.status(400).json({ error: 'At least one guest is required' });
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

    const warnings: string[] = [];

    // Check guest limits
    if (menuPackage.minGuests && totalGuests < menuPackage.minGuests) {
      warnings.push(
        `Package requires minimum ${menuPackage.minGuests} guests, but ${totalGuests} provided`,
      );
    }

    if (menuPackage.maxGuests && totalGuests > menuPackage.maxGuests) {
      warnings.push(
        `Package allows maximum ${menuPackage.maxGuests} guests, but ${totalGuests} provided`,
      );
    }

    // Calculate package prices
    const pricePerAdult = toNumber(menuPackage.pricePerAdult);
    const pricePerChild = toNumber(menuPackage.pricePerChild);
    const pricePerToddler = toNumber(menuPackage.pricePerToddler);

    const adultsSubtotal = pricePerAdult * adults;
    const childrenSubtotal = pricePerChild * children;
    const toddlersSubtotal = pricePerToddler * toddlers;

    const packageTotal = adultsSubtotal + childrenSubtotal + toddlersSubtotal;

    const priceBreakdown = {
      pricePerAdult,
      pricePerChild,
      pricePerToddler,
      adultsCount: adults,
      childrenCount: children,
      toddlersCount: toddlers,
      adultsSubtotal: roundToTwo(adultsSubtotal),
      childrenSubtotal: roundToTwo(childrenSubtotal),
      toddlersSubtotal: roundToTwo(toddlersSubtotal),
      packageTotal: roundToTwo(packageTotal),
    };

    /* istanbul ignore next -- totalGuests always > 0 here (guarded above) */
    const averagePerGuest = totalGuests > 0 ? packageTotal / totalGuests : 0;

    const response = {
      packageId: menuPackage.id,
      packageName: menuPackage.name,
      priceBreakdown,
      optionsDetails: [],
      optionsTotal: 0,
      totalGuests,
      grandTotal: roundToTwo(packageTotal),
      averagePerGuest: roundToTwo(averagePerGuest),
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error calculating menu price:', error);
    /* istanbul ignore next -- error.message fallback */
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /api/menu-calculator/packages/available
 * Get available packages for event type and date
 */
export async function getAvailablePackages(req: Request, res: Response) {
  try {
    const { eventTypeId, date } = req.query;

    if (!eventTypeId || typeof eventTypeId !== 'string') {
      return res.status(400).json({ error: 'eventTypeId is required' });
    }

    const whereClause: any = {
      menuTemplate: {
        eventTypeId,
        isActive: true,
      },
    };

    // Filter by date if provided
    if (date && typeof date === 'string') {
      const parsedDate = new Date(date);
      whereClause.menuTemplate.OR = [
        { validFrom: null, validTo: null },
        { validFrom: { lte: parsedDate }, validTo: { gte: parsedDate } },
        { validFrom: { lte: parsedDate }, validTo: null },
        { validFrom: null, validTo: { gte: parsedDate } },
      ];
    }

    const packages = await prisma.menuPackage.findMany({
      where: whereClause,
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
      },
      orderBy: [
        { isPopular: 'desc' },
        { isRecommended: 'desc' },
        { displayOrder: 'asc' },
      ],
    });

    res.json({
      eventTypeId,
      date: date || null,
      count: packages.length,
      packages,
    });
  } catch (error: any) {
    logger.error('Error getting available packages:', error);
    /* istanbul ignore next -- error.message fallback */
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /api/menu-calculator/option/:optionId/calculate
 * DEPRECATED: MenuOption model removed. Returns 410 Gone.
 */
export async function calculateOptionPrice(req: Request, res: Response) {
  return res.status(410).json({
    error: 'MenuOption model has been removed. Use ServiceExtras system instead.',
  });
}
