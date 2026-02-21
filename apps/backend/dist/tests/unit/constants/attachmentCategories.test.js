import { ENTITY_TYPES, ATTACHMENT_CATEGORIES, getValidCategories, isValidCategory, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, STORAGE_DIRS, } from '../../../constants/attachmentCategories';
describe('attachmentCategories constants', () => {
    describe('ENTITY_TYPES', () => {
        it('should contain CLIENT, RESERVATION, DEPOSIT', () => {
            expect(ENTITY_TYPES).toContain('CLIENT');
            expect(ENTITY_TYPES).toContain('RESERVATION');
            expect(ENTITY_TYPES).toContain('DEPOSIT');
            expect(ENTITY_TYPES).toHaveLength(3);
        });
    });
    describe('ATTACHMENT_CATEGORIES', () => {
        it('should have categories for all entity types', () => {
            ENTITY_TYPES.forEach((et) => {
                expect(ATTACHMENT_CATEGORIES[et]).toBeDefined();
                expect(ATTACHMENT_CATEGORIES[et].length).toBeGreaterThan(0);
            });
        });
        it('every category should have value and label', () => {
            ENTITY_TYPES.forEach((et) => {
                ATTACHMENT_CATEGORIES[et].forEach((cat) => {
                    expect(cat.value).toBeDefined();
                    expect(cat.label).toBeDefined();
                    expect(cat.value.length).toBeGreaterThan(0);
                });
            });
        });
        it('CLIENT should have RODO, CORRESPONDENCE, OTHER', () => {
            const values = ATTACHMENT_CATEGORIES.CLIENT.map((c) => c.value);
            expect(values).toContain('RODO');
            expect(values).toContain('CORRESPONDENCE');
            expect(values).toContain('OTHER');
        });
        it('RESERVATION should have CONTRACT and ANNEX', () => {
            const values = ATTACHMENT_CATEGORIES.RESERVATION.map((c) => c.value);
            expect(values).toContain('CONTRACT');
            expect(values).toContain('ANNEX');
            expect(values).toContain('POST_EVENT');
        });
        it('DEPOSIT should have PAYMENT_PROOF and INVOICE', () => {
            const values = ATTACHMENT_CATEGORIES.DEPOSIT.map((c) => c.value);
            expect(values).toContain('PAYMENT_PROOF');
            expect(values).toContain('INVOICE');
            expect(values).toContain('REFUND_PROOF');
        });
    });
    describe('getValidCategories', () => {
        it('should return category values for CLIENT', () => {
            const cats = getValidCategories('CLIENT');
            expect(cats).toContain('RODO');
            expect(cats).toContain('OTHER');
        });
        it('should return category values for RESERVATION', () => {
            const cats = getValidCategories('RESERVATION');
            expect(cats).toContain('CONTRACT');
        });
        it('should return category values for DEPOSIT', () => {
            const cats = getValidCategories('DEPOSIT');
            expect(cats).toContain('PAYMENT_PROOF');
        });
    });
    describe('isValidCategory', () => {
        it('should return true for valid CLIENT category', () => {
            expect(isValidCategory('CLIENT', 'RODO')).toBe(true);
        });
        it('should return false for invalid CLIENT category', () => {
            expect(isValidCategory('CLIENT', 'INVOICE')).toBe(false);
        });
        it('should return true for valid DEPOSIT category', () => {
            expect(isValidCategory('DEPOSIT', 'INVOICE')).toBe(true);
        });
        it('should return false for nonexistent category', () => {
            expect(isValidCategory('RESERVATION', 'NONEXISTENT')).toBe(false);
        });
    });
    describe('ALLOWED_MIME_TYPES', () => {
        it('should include PDF and image types', () => {
            expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
            expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
            expect(ALLOWED_MIME_TYPES).toContain('image/png');
            expect(ALLOWED_MIME_TYPES).toContain('image/webp');
        });
    });
    describe('MAX_FILE_SIZE', () => {
        it('should be 10 MB', () => {
            expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
        });
    });
    describe('STORAGE_DIRS', () => {
        it('should map entity types to directories', () => {
            expect(STORAGE_DIRS.CLIENT).toBe('clients');
            expect(STORAGE_DIRS.RESERVATION).toBe('reservations');
            expect(STORAGE_DIRS.DEPOSIT).toBe('deposits');
        });
    });
});
//# sourceMappingURL=attachmentCategories.test.js.map