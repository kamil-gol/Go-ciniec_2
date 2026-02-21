import { createMenuTemplateSchema, duplicateMenuTemplateSchema, createMenuPackageSchema, reorderPackagesSchema, categorySettingSchema, createMenuOptionSchema, selectMenuSchema, updateMenuSelectionSchema, } from '../../../validation/menu.validation';
const validUUID = '550e8400-e29b-41d4-a716-446655440000';
describe('menu.validation', () => {
    describe('createMenuTemplateSchema', () => {
        const validTemplate = { eventTypeId: validUUID, name: 'Menu Wesele Premium', validFrom: '2025-01-01' };
        it('should accept valid template', () => {
            const result = createMenuTemplateSchema.parse(validTemplate);
            expect(result.name).toBe('Menu Wesele Premium');
            expect(result.isActive).toBe(true);
        });
        it('should reject name < 3 chars', () => {
            expect(() => createMenuTemplateSchema.parse({ ...validTemplate, name: 'AB' })).toThrow();
        });
        it('should reject name > 100 chars', () => {
            expect(() => createMenuTemplateSchema.parse({ ...validTemplate, name: 'A'.repeat(101) })).toThrow();
        });
        it('should reject validFrom >= validTo', () => {
            expect(() => createMenuTemplateSchema.parse({ ...validTemplate, validFrom: '2025-06-01', validTo: '2025-01-01' })).toThrow(/before/i);
        });
        it('should accept validTo = null', () => {
            const result = createMenuTemplateSchema.parse({ ...validTemplate, validTo: null });
            expect(result.validTo).toBeNull();
        });
        it('should reject invalid eventTypeId', () => {
            expect(() => createMenuTemplateSchema.parse({ ...validTemplate, eventTypeId: 'bad' })).toThrow();
        });
    });
    describe('duplicateMenuTemplateSchema', () => {
        it('should accept valid duplicate data', () => {
            const result = duplicateMenuTemplateSchema.parse({ newName: 'Menu Kopia', validFrom: '2025-06-01' });
            expect(result.newName).toBe('Menu Kopia');
        });
        it('should reject short name', () => {
            expect(() => duplicateMenuTemplateSchema.parse({ newName: 'AB', validFrom: '2025-01-01' })).toThrow();
        });
    });
    describe('createMenuPackageSchema', () => {
        const validPackage = { menuTemplateId: validUUID, name: 'Pakiet Standard', pricePerAdult: 150, pricePerChild: 80, pricePerToddler: 0 };
        it('should accept valid package', () => {
            const result = createMenuPackageSchema.parse(validPackage);
            expect(result.name).toBe('Pakiet Standard');
            expect(result.isPopular).toBe(false);
            expect(result.isRecommended).toBe(false);
        });
        it('should reject negative pricePerAdult', () => {
            expect(() => createMenuPackageSchema.parse({ ...validPackage, pricePerAdult: -10 })).toThrow();
        });
        it('should reject minGuests > maxGuests', () => {
            expect(() => createMenuPackageSchema.parse({ ...validPackage, minGuests: 100, maxGuests: 10 })).toThrow();
        });
        it('should accept valid hex color', () => {
            const result = createMenuPackageSchema.parse({ ...validPackage, color: '#FF5733' });
            expect(result.color).toBe('#FF5733');
        });
        it('should reject invalid hex color', () => {
            expect(() => createMenuPackageSchema.parse({ ...validPackage, color: 'red' })).toThrow();
        });
        it('should transform empty color string to null', () => {
            const result = createMenuPackageSchema.parse({ ...validPackage, color: '' });
            expect(result.color).toBeNull();
        });
    });
    describe('reorderPackagesSchema', () => {
        it('should accept valid reorder', () => {
            const result = reorderPackagesSchema.parse({ packageOrders: [{ packageId: validUUID, displayOrder: 0 }] });
            expect(result.packageOrders).toHaveLength(1);
        });
        it('should reject empty array', () => {
            expect(() => reorderPackagesSchema.parse({ packageOrders: [] })).toThrow();
        });
    });
    describe('categorySettingSchema', () => {
        const validSetting = { categoryId: validUUID, minSelect: 1, maxSelect: 5 };
        it('should accept valid settings', () => {
            const result = categorySettingSchema.parse(validSetting);
            expect(result.isRequired).toBe(true);
            expect(result.isEnabled).toBe(true);
        });
        it('should reject minSelect > maxSelect', () => {
            expect(() => categorySettingSchema.parse({ ...validSetting, minSelect: 10, maxSelect: 2 })).toThrow();
        });
        it('should reject negative minSelect', () => {
            expect(() => categorySettingSchema.parse({ ...validSetting, minSelect: -1 })).toThrow();
        });
    });
    describe('createMenuOptionSchema', () => {
        const validOption = { name: 'Dekoracje sto\u0142u', category: 'Dekoracje', priceType: 'PER_PERSON', priceAmount: 25 };
        it('should accept valid option', () => {
            const result = createMenuOptionSchema.parse(validOption);
            expect(result.name).toBe('Dekoracje sto\u0142u');
            expect(result.allowMultiple).toBe(false);
        });
        it('should reject invalid priceType', () => {
            expect(() => createMenuOptionSchema.parse({ ...validOption, priceType: 'HOURLY' })).toThrow();
        });
        it('should accept all valid priceTypes', () => {
            ['PER_PERSON', 'FLAT', 'FREE'].forEach((pt) => {
                const result = createMenuOptionSchema.parse({ ...validOption, priceType: pt });
                expect(result.priceType).toBe(pt);
            });
        });
        it('should reject negative price', () => {
            expect(() => createMenuOptionSchema.parse({ ...validOption, priceAmount: -5 })).toThrow();
        });
        it('should reject name < 2 chars', () => {
            expect(() => createMenuOptionSchema.parse({ ...validOption, name: 'A' })).toThrow();
        });
    });
    describe('selectMenuSchema', () => {
        it('should accept minimal selection', () => {
            const result = selectMenuSchema.parse({ packageId: validUUID });
            expect(result.selectedOptions).toEqual([]);
            expect(result.dishSelections).toEqual([]);
        });
        it('should accept full selection with options and dishes', () => {
            const result = selectMenuSchema.parse({
                packageId: validUUID,
                selectedOptions: [{ optionId: validUUID, quantity: 2 }],
                dishSelections: [{ categoryId: validUUID, dishes: [{ dishId: validUUID, quantity: 1 }] }],
            });
            expect(result.selectedOptions).toHaveLength(1);
            expect(result.dishSelections).toHaveLength(1);
        });
        it('should reject invalid packageId', () => {
            expect(() => selectMenuSchema.parse({ packageId: 'bad' })).toThrow();
        });
        it('should reject quantity < 1 in selectedOptions', () => {
            expect(() => selectMenuSchema.parse({ packageId: validUUID, selectedOptions: [{ optionId: validUUID, quantity: 0 }] })).toThrow();
        });
    });
    describe('updateMenuSelectionSchema', () => {
        it('should accept partial guest count update', () => {
            const result = updateMenuSelectionSchema.parse({ adultsCount: 60 });
            expect(result.adultsCount).toBe(60);
        });
        it('should reject negative adults count', () => {
            expect(() => updateMenuSelectionSchema.parse({ adultsCount: -1 })).toThrow();
        });
        it('should accept all zeros', () => {
            const result = updateMenuSelectionSchema.parse({ adultsCount: 0, childrenCount: 0, toddlersCount: 0 });
            expect(result.adultsCount).toBe(0);
        });
    });
});
//# sourceMappingURL=menu.validation.test.js.map