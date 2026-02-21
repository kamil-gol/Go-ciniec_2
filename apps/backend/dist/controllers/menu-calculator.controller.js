/**
 * Menu Calculator Controller (Express)
 *
 * Handles menu price calculation requests
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// === Utilities ===
function toNumber(decimal) {
    return parseFloat(decimal.toString());
}
function roundToTwo(num) {
    return Math.round(num * 100) / 100;
}
/**
 * POST /api/menu-calculator/calculate
 * Calculate menu price
 */
export async function calculatePrice(req, res) {
    try {
        const dto = req.body;
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
        const warnings = [];
        // Check guest limits
        if (menuPackage.minGuests && totalGuests < menuPackage.minGuests) {
            warnings.push(`Package requires minimum ${menuPackage.minGuests} guests, but ${totalGuests} provided`);
        }
        if (menuPackage.maxGuests && totalGuests > menuPackage.maxGuests) {
            warnings.push(`Package allows maximum ${menuPackage.maxGuests} guests, but ${totalGuests} provided`);
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
        // Calculate options prices
        let optionsTotal = 0;
        const optionsDetails = [];
        if (dto.selectedOptions && dto.selectedOptions.length > 0) {
            const optionIds = dto.selectedOptions.map((opt) => opt.optionId);
            const options = await prisma.menuOption.findMany({
                where: {
                    id: { in: optionIds },
                    isActive: true,
                },
            });
            for (const selectedOption of dto.selectedOptions) {
                const option = options.find((opt) => opt.id === selectedOption.optionId);
                if (!option) {
                    warnings.push(`Option ${selectedOption.optionId} not found or inactive`);
                    continue;
                }
                const basePrice = selectedOption.customPrice ?? toNumber(option.priceAmount);
                let calculatedPrice = 0;
                switch (option.priceType) {
                    case 'PER_PERSON':
                        calculatedPrice = basePrice * totalGuests * selectedOption.quantity;
                        break;
                    case 'PER_ADULT':
                        calculatedPrice = basePrice * adults * selectedOption.quantity;
                        break;
                    case 'PER_CHILD':
                        calculatedPrice = basePrice * children * selectedOption.quantity;
                        break;
                    case 'PER_GUEST_TYPE':
                        const adultPrice = basePrice * adults;
                        const childPrice = basePrice * 0.5 * children;
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
                optionsTotal += calculatedPrice;
            }
        }
        // Grand total
        const grandTotal = packageTotal + optionsTotal;
        /* istanbul ignore next -- totalGuests always > 0 here (guarded above) */
        const averagePerGuest = totalGuests > 0 ? grandTotal / totalGuests : 0;
        const response = {
            packageId: menuPackage.id,
            packageName: menuPackage.name,
            priceBreakdown,
            optionsDetails,
            optionsTotal: roundToTwo(optionsTotal),
            totalGuests,
            grandTotal: roundToTwo(grandTotal),
            averagePerGuest: roundToTwo(averagePerGuest),
            warnings: warnings.length > 0 ? warnings : undefined,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error calculating menu price:', error);
        /* istanbul ignore next -- error.message fallback */
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
/**
 * GET /api/menu-calculator/packages/available
 * Get available packages for event type and date
 */
export async function getAvailablePackages(req, res) {
    try {
        const { eventTypeId, date } = req.query;
        if (!eventTypeId || typeof eventTypeId !== 'string') {
            return res.status(400).json({ error: 'eventTypeId is required' });
        }
        const whereClause = {
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
                _count: {
                    select: {
                        packageOptions: true,
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
    }
    catch (error) {
        console.error('Error getting available packages:', error);
        /* istanbul ignore next -- error.message fallback */
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
/**
 * GET /api/menu-calculator/option/:optionId/calculate
 * Calculate price for a single option
 */
export async function calculateOptionPrice(req, res) {
    try {
        const { optionId } = req.params;
        const { adults, children = '0', toddlers = '0', quantity = '1' } = req.query;
        if (!adults || typeof adults !== 'string') {
            return res.status(400).json({ error: 'adults query parameter is required' });
        }
        const guests = {
            adults: parseInt(adults, 10),
            children: parseInt(children, 10),
            toddlers: parseInt(toddlers, 10),
        };
        const qty = parseInt(quantity, 10);
        const totalGuests = guests.adults + guests.children + guests.toddlers;
        // Fetch option
        const option = await prisma.menuOption.findUnique({
            where: { id: optionId },
        });
        if (!option || !option.isActive) {
            return res.status(404).json({ error: 'Menu option not found or inactive' });
        }
        const basePrice = toNumber(option.priceAmount);
        let calculatedPrice = 0;
        switch (option.priceType) {
            case 'PER_PERSON':
                calculatedPrice = basePrice * totalGuests * qty;
                break;
            case 'PER_ADULT':
                calculatedPrice = basePrice * guests.adults * qty;
                break;
            case 'PER_CHILD':
                calculatedPrice = basePrice * guests.children * qty;
                break;
            case 'PER_GUEST_TYPE':
                const adultPrice = basePrice * guests.adults;
                const childPrice = basePrice * 0.5 * guests.children;
                calculatedPrice = (adultPrice + childPrice) * qty;
                break;
            case 'FLAT_FEE':
            default:
                calculatedPrice = basePrice * qty;
                break;
        }
        res.json({
            optionId,
            optionName: option.name,
            priceType: option.priceType,
            basePrice,
            guests,
            quantity: qty,
            calculatedPrice: roundToTwo(calculatedPrice),
        });
    }
    catch (error) {
        console.error('Error calculating option price:', error);
        /* istanbul ignore next -- error.message fallback */
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
//# sourceMappingURL=menu-calculator.controller.js.map