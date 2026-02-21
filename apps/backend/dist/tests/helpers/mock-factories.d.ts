/**
 * Mock Factories
 *
 * Factory functions for generating test data objects.
 * Use these in unit tests where you need realistic but
 * deterministic data without touching the database.
 */
export declare function resetFactoryCounter(): void;
export declare function buildClient(overrides?: Record<string, any>): {
    id: number;
    name: string;
    email: string;
    phone: string;
    notes: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildHall(overrides?: Record<string, any>): {
    id: number;
    name: string;
    capacity: number;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildEventType(overrides?: Record<string, any>): {
    id: number;
    name: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildReservation(overrides?: Record<string, any>): {
    id: number;
    clientId: any;
    hallId: any;
    eventTypeId: any;
    date: Date;
    startTime: string;
    endTime: string;
    guestCount: number;
    status: string;
    notes: null;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildQueueItem(overrides?: Record<string, any>): {
    id: number;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    eventTypeId: number;
    hallId: null;
    preferredDate: Date;
    guestCount: number;
    notes: null;
    position: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildDeposit(overrides?: Record<string, any>): {
    id: number;
    reservationId: any;
    amount: number;
    status: string;
    dueDate: Date;
    paidAt: null;
    notes: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildUser(overrides?: Record<string, any>): {
    id: number;
    email: string;
    name: string;
    password: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildMenuTemplate(overrides?: Record<string, any>): {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildDish(overrides?: Record<string, any>): {
    id: number;
    name: string;
    description: string;
    categoryId: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
//# sourceMappingURL=mock-factories.d.ts.map