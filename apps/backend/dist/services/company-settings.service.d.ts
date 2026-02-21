declare class CompanySettingsService {
    getSettings(): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyName: string;
        nip: string | null;
        regon: string | null;
        address: string | null;
        city: string | null;
        postalCode: string | null;
        website: string | null;
        logoUrl: string | null;
        defaultCurrency: string;
        timezone: string;
        invoicePrefix: string | null;
        receiptPrefix: string | null;
    }>;
    updateSettings(data: {
        companyName?: string;
        nip?: string;
        regon?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        phone?: string;
        email?: string;
        website?: string;
        logoUrl?: string;
        defaultCurrency?: string;
        timezone?: string;
        invoicePrefix?: string;
        receiptPrefix?: string;
    }, actorId: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyName: string;
        nip: string | null;
        regon: string | null;
        address: string | null;
        city: string | null;
        postalCode: string | null;
        website: string | null;
        logoUrl: string | null;
        defaultCurrency: string;
        timezone: string;
        invoicePrefix: string | null;
        receiptPrefix: string | null;
    }>;
}
declare const _default: CompanySettingsService;
export default _default;
//# sourceMappingURL=company-settings.service.d.ts.map