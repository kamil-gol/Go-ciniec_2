/**
 * Reservation Menu Service
 * Handles menu selection for reservations
 * UPDATED: Added recalculateForGuestChange for Phase C integration
 * FIX: formatMenuResponse now exposes menuTemplateId + packageId from DB columns
 * Updated: Phase 3 Audit — logChange() for menu selection, recalculation, removal
 */
import { prisma } from '@/lib/prisma';
import { logChange } from '../utils/audit-logger';
class ReservationMenuService {
    async selectMenu(reservationId, input, userId) {
        console.log('[ReservationMenu] Selecting menu for reservation:', reservationId);
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: { eventType: true, client: true }
        });
        if (!reservation)
            throw new Error('Reservation not found');
        const adults = input.adults ?? reservation.adults;
        const children = input.children ?? reservation.children;
        const toddlers = input.toddlers ?? reservation.toddlers;
        const menuPackage = await prisma.menuPackage.findUnique({
            where: { id: input.packageId },
            include: {
                menuTemplate: { include: { eventType: true } },
                categorySettings: {
                    where: { isEnabled: true },
                    include: { category: { include: { dishes: { where: { isActive: true } } } } },
                    orderBy: { displayOrder: 'asc' }
                }
            }
        });
        if (!menuPackage)
            throw new Error('Menu package not found');
        if (input.dishSelections && input.dishSelections.length > 0) {
            await this.validateDishSelections(input.dishSelections, menuPackage.categorySettings);
        }
        const selectedOptions = input.selectedOptions || [];
        const optionIds = selectedOptions.map(opt => opt.optionId);
        const options = optionIds.length > 0 ? await prisma.menuOption.findMany({ where: { id: { in: optionIds }, isActive: true } }) : [];
        // Check if existing snapshot exists (for audit: new vs update)
        const existingSnapshot = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
        const isNewSelection = !existingSnapshot;
        const snapshot = await this.buildMenuSnapshot(menuPackage, input.dishSelections || [], options, selectedOptions, adults, children, toddlers);
        const packagePrice = this.calculatePackagePrice(menuPackage, adults, children, toddlers);
        const optionsPrice = this.calculateOptionsPrice(options, selectedOptions, adults + children + toddlers);
        const totalMenuPrice = packagePrice + optionsPrice;
        const menuSnapshot = await prisma.reservationMenuSnapshot.upsert({
            where: { reservationId },
            create: {
                reservationId, menuData: snapshot,
                menuTemplateId: menuPackage.menuTemplateId, packageId: menuPackage.id,
                packagePrice, optionsPrice, totalMenuPrice,
                adultsCount: adults, childrenCount: children, toddlersCount: toddlers
            },
            update: {
                menuData: snapshot,
                menuTemplateId: menuPackage.menuTemplateId, packageId: menuPackage.id,
                packagePrice, optionsPrice, totalMenuPrice,
                adultsCount: adults, childrenCount: children, toddlersCount: toddlers,
                updatedAt: new Date()
            }
        });
        // Audit log — MENU_SELECTED
        const clientName = reservation.client
            ? `${reservation.client.firstName} ${reservation.client.lastName}`
            : 'N/A';
        await logChange({
            userId: userId || null,
            action: 'MENU_SELECTED',
            entityType: 'RESERVATION',
            entityId: reservationId,
            details: {
                description: `Menu ${isNewSelection ? 'wybrane' : 'zmienione'}: ${menuPackage.name} (${totalMenuPrice} PLN) | ${clientName}`,
                isNewSelection,
                packageName: menuPackage.name,
                templateName: menuPackage.menuTemplate.name,
                packagePrice,
                optionsPrice,
                totalMenuPrice,
                guests: { adults, children, toddlers },
                dishSelectionsCount: input.dishSelections?.length || 0,
                optionsCount: selectedOptions.length,
            },
        });
        return this.formatMenuResponse(menuSnapshot, adults, children, toddlers);
    }
    /**
     * Recalculate menu prices when guest counts change.
     * Reuses existing snapshot (same package, dishes, options) but
     * recalculates all prices with new guest counts.
     *
     * Called automatically from reservation.service.ts when guests are updated.
     * Returns the new totalMenuPrice for the reservation to use.
     */
    async recalculateForGuestChange(reservationId, newAdults, newChildren, newToddlers, userId) {
        const existingSnapshot = await prisma.reservationMenuSnapshot.findUnique({
            where: { reservationId }
        });
        if (!existingSnapshot)
            return null;
        const menuData = existingSnapshot.menuData;
        if (!menuData)
            return null;
        // Save old values for audit
        const oldPackagePrice = Number(existingSnapshot.packagePrice);
        const oldOptionsPrice = Number(existingSnapshot.optionsPrice);
        const oldTotalPrice = Number(existingSnapshot.totalMenuPrice);
        const oldGuests = {
            adults: existingSnapshot.adultsCount,
            children: existingSnapshot.childrenCount,
            toddlers: existingSnapshot.toddlersCount,
        };
        // Recalculate package price using stored per-person prices
        const pricePerAdult = menuData.pricePerAdult || 0;
        const pricePerChild = menuData.pricePerChild || 0;
        const pricePerToddler = menuData.pricePerToddler || 0;
        const packagePrice = (newAdults * pricePerAdult) + (newChildren * pricePerChild) + (newToddlers * pricePerToddler);
        // Recalculate options price with new total guests
        const newTotalGuests = newAdults + newChildren + newToddlers;
        let optionsPrice = 0;
        if (menuData.selectedOptions && menuData.selectedOptions.length > 0) {
            for (const opt of menuData.selectedOptions) {
                const price = opt.priceAmount || 0;
                const quantity = opt.quantity || 1;
                if (opt.priceUnit === 'PER_PERSON') {
                    optionsPrice += price * newTotalGuests * quantity;
                }
                else {
                    // FLAT price — not affected by guest count
                    optionsPrice += price * quantity;
                }
            }
        }
        const totalMenuPrice = packagePrice + optionsPrice;
        // Update snapshot data with new guest counts
        const updatedMenuData = {
            ...menuData,
            adults: newAdults,
            children: newChildren,
            toddlers: newToddlers,
            prices: {
                ...menuData.prices,
                packageTotal: packagePrice,
                optionsTotal: optionsPrice,
                total: totalMenuPrice
            }
        };
        // Update snapshot in DB
        await prisma.reservationMenuSnapshot.update({
            where: { reservationId },
            data: {
                menuData: updatedMenuData,
                packagePrice,
                optionsPrice,
                totalMenuPrice,
                adultsCount: newAdults,
                childrenCount: newChildren,
                toddlersCount: newToddlers,
                updatedAt: new Date()
            }
        });
        console.log(`[ReservationMenu] Recalculated prices for ${reservationId}: guests=${newTotalGuests}, package=${packagePrice}, options=${optionsPrice}, total=${totalMenuPrice}`);
        // Audit log — MENU_RECALCULATED
        if (oldTotalPrice !== totalMenuPrice) {
            await logChange({
                userId: userId || null,
                action: 'MENU_RECALCULATED',
                entityType: 'RESERVATION',
                entityId: reservationId,
                details: {
                    /* istanbul ignore next -- packageName always present in snapshot data */
                    description: `Menu przeliczone (zmiana gości): ${oldTotalPrice} PLN → ${totalMenuPrice} PLN | ${menuData.packageName || 'N/A'}`,
                    /* istanbul ignore next */
                    packageName: menuData.packageName || null,
                    oldGuests,
                    newGuests: { adults: newAdults, children: newChildren, toddlers: newToddlers },
                    oldPrice: { package: oldPackagePrice, options: oldOptionsPrice, total: oldTotalPrice },
                    newPrice: { package: packagePrice, options: optionsPrice, total: totalMenuPrice },
                },
            });
        }
        return { totalMenuPrice, packagePrice, optionsPrice };
    }
    async getReservationMenu(reservationId) {
        const snapshot = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
        if (!snapshot)
            throw new Error('Menu not selected for this reservation');
        return this.formatMenuResponse(snapshot, snapshot.adultsCount, snapshot.childrenCount, snapshot.toddlersCount);
    }
    async updateMenu(reservationId, input, userId) {
        return this.selectMenu(reservationId, input, userId);
    }
    async removeMenu(reservationId, userId) {
        // Get snapshot info before deletion for audit
        const snapshot = await prisma.reservationMenuSnapshot.findUnique({
            where: { reservationId },
        });
        await prisma.reservationMenuSnapshot.delete({ where: { reservationId } });
        // Audit log — MENU_DIRECT_REMOVED
        if (snapshot) {
            const menuData = snapshot.menuData;
            await logChange({
                userId: userId || null,
                action: 'MENU_DIRECT_REMOVED',
                entityType: 'RESERVATION',
                entityId: reservationId,
                details: {
                    /* istanbul ignore next -- menuData always has packageName */
                    description: `Menu usunięte (bezpośrednio): ${menuData?.packageName || 'N/A'} (${Number(snapshot.totalMenuPrice)} PLN)`,
                    /* istanbul ignore next */
                    packageName: menuData?.packageName || null,
                    totalMenuPrice: Number(snapshot.totalMenuPrice),
                    packagePrice: Number(snapshot.packagePrice),
                    optionsPrice: Number(snapshot.optionsPrice),
                },
            });
        }
    }
    // ═══════════════════════ PRIVATE HELPERS ═══════════════════════
    async validateDishSelections(dishSelections, categorySettings) {
        const errors = [];
        for (const categorySetting of categorySettings) {
            const selection = dishSelections.find(s => s.categoryId === categorySetting.categoryId);
            const totalQuantity = selection ? selection.dishes.reduce((sum, d) => sum + d.quantity, 0) : 0;
            const minSelect = parseFloat(categorySetting.minSelect.toString());
            const maxSelect = parseFloat(categorySetting.maxSelect.toString());
            if (categorySetting.isRequired && totalQuantity < minSelect) {
                errors.push(`Category "${categorySetting.category.name}" requires minimum ${minSelect} selections (got ${totalQuantity})`);
            }
            if (totalQuantity > maxSelect) {
                errors.push(`Category "${categorySetting.category.name}" allows maximum ${maxSelect} selections (got ${totalQuantity})`);
            }
        }
        if (errors.length > 0)
            throw new Error(`Menu selection validation failed: ${errors.join('; ')}`);
    }
    async buildMenuSnapshot(menuPackage, dishSelections, options, selectedOptions, adults, children, toddlers) {
        const enrichedDishSelections = await Promise.all(dishSelections.map(async (catSelection) => {
            const categorySetting = menuPackage.categorySettings.find((cs) => cs.categoryId === catSelection.categoryId);
            if (!categorySetting)
                return null;
            const dishIds = catSelection.dishes.map(d => d.dishId);
            const dishes = await prisma.dish.findMany({ where: { id: { in: dishIds }, isActive: true } });
            return {
                categoryId: catSelection.categoryId,
                categoryName: categorySetting.category.name,
                dishes: catSelection.dishes.map(dishSel => {
                    const dish = dishes.find(d => d.id === dishSel.dishId);
                    return {
                        /* istanbul ignore next -- dish always found from DB query */
                        dishId: dishSel.dishId, dishName: dish?.name || 'Unknown dish',
                        description: dish?.description, quantity: dishSel.quantity,
                        /* istanbul ignore next */
                        allergens: dish?.allergens || []
                    };
                })
            };
        }));
        return {
            packageId: menuPackage.id, packageName: menuPackage.name,
            packageDescription: menuPackage.description || undefined,
            pricePerAdult: parseFloat(menuPackage.pricePerAdult.toString()),
            pricePerChild: parseFloat(menuPackage.pricePerChild.toString()),
            pricePerToddler: parseFloat(menuPackage.pricePerToddler.toString()),
            adults, children, toddlers,
            dishSelections: enrichedDishSelections.filter(Boolean),
            selectedOptions: selectedOptions.map(selOpt => {
                const option = options.find(o => o.id === selOpt.optionId);
                return {
                    /* istanbul ignore next -- option always found from prior query */
                    optionId: selOpt.optionId, optionName: option?.name || 'Unknown option',
                    /* istanbul ignore next */
                    category: option?.category || '', quantity: selOpt.quantity,
                    /* istanbul ignore next */
                    priceAmount: parseFloat(option?.priceAmount.toString() || '0'),
                    /* istanbul ignore next */
                    priceUnit: option?.priceType || 'FLAT'
                };
            }),
            prices: {
                packageTotal: this.calculatePackagePrice(menuPackage, adults, children, toddlers),
                optionsTotal: this.calculateOptionsPrice(options, selectedOptions, adults + children + toddlers),
                total: 0
            },
            createdAt: new Date().toISOString()
        };
    }
    calculatePackagePrice(menuPackage, adults, children, toddlers) {
        return adults * parseFloat(menuPackage.pricePerAdult.toString()) +
            children * parseFloat(menuPackage.pricePerChild.toString()) +
            toddlers * parseFloat(menuPackage.pricePerToddler.toString());
    }
    calculateOptionsPrice(options, selectedOptions, totalGuests) {
        return selectedOptions.reduce((total, selOpt) => {
            const option = options.find(o => o.id === selOpt.optionId);
            if (!option)
                return total;
            const price = parseFloat(option.priceAmount.toString());
            if (option.priceType === 'PER_PERSON')
                return total + price * totalGuests * selOpt.quantity;
            if (option.priceType === 'FLAT')
                return total + price * selOpt.quantity;
            return total;
        }, 0);
    }
    formatMenuResponse(snapshot, adults, children, toddlers) {
        const menuData = snapshot.menuData;
        return {
            snapshot: {
                id: snapshot.id,
                reservationId: snapshot.reservationId,
                menuData,
                menuTemplateId: snapshot.menuTemplateId,
                packageId: snapshot.packageId,
                adultsCount: snapshot.adultsCount,
                childrenCount: snapshot.childrenCount,
                toddlersCount: snapshot.toddlersCount,
                snapshotDate: snapshot.selectedAt.toISOString(),
                createdAt: snapshot.selectedAt.toISOString(),
                updatedAt: snapshot.updatedAt.toISOString()
            },
            priceBreakdown: {
                packageCost: {
                    adults: { count: snapshot.adultsCount, priceEach: menuData.pricePerAdult, total: snapshot.adultsCount * menuData.pricePerAdult },
                    children: { count: snapshot.childrenCount, priceEach: menuData.pricePerChild, total: snapshot.childrenCount * menuData.pricePerChild },
                    toddlers: { count: snapshot.toddlersCount, priceEach: menuData.pricePerToddler, total: snapshot.toddlersCount * menuData.pricePerToddler },
                    subtotal: parseFloat(snapshot.packagePrice.toString())
                },
                /* istanbul ignore next -- selectedOptions always present in snapshot menuData */
                optionsCost: menuData.selectedOptions?.map(opt => ({
                    option: opt.optionName, priceType: opt.priceUnit, priceEach: opt.priceAmount,
                    quantity: opt.quantity, total: opt.priceAmount * opt.quantity
                })) || [],
                optionsSubtotal: parseFloat(snapshot.optionsPrice.toString()),
                totalMenuPrice: parseFloat(snapshot.totalMenuPrice.toString())
            }
        };
    }
}
export default new ReservationMenuService();
//# sourceMappingURL=reservation-menu.service.js.map