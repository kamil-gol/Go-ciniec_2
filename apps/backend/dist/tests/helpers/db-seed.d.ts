export interface TestSeedData {
    admin: any;
    user: any;
    readonlyUser: any;
    hall1: any;
    hall2: any;
    eventType1: any;
    eventType2: any;
    client1: any;
    client2: any;
}
export declare function seedTestData(): Promise<TestSeedData>;
/**
 * Quick seed: only users (for auth tests).
 * Also uses find-or-create pattern.
 */
export declare function seedUsersOnly(): Promise<{
    admin: {
        password: string;
        id: string;
        email: string;
        roleId: string | null;
        firstName: string;
        lastName: string;
        legacyRole: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
//# sourceMappingURL=db-seed.d.ts.map