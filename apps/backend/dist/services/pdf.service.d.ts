interface DishSelection {
    dishId: string;
    dishName: string;
    quantity: number;
    allergens?: string[];
    description?: string;
}
interface CategorySelection {
    categoryId: string;
    categoryName: string;
    dishes: DishSelection[];
}
interface MenuData {
    packageId?: string;
    packageName?: string;
    dishSelections?: CategorySelection[];
    selectedOptions?: any[];
}
interface MenuSnapshot {
    id: string;
    menuData: any;
    packagePrice: number;
    optionsPrice: number;
    totalMenuPrice: number;
    adultsCount: number;
    childrenCount: number;
    toddlersCount: number;
    selectedAt: Date;
}
interface ReservationPDFData {
    id: string;
    client: {
        firstName: string;
        lastName: string;
        email?: string;
        phone: string;
        address?: string;
    };
    hall?: {
        name: string;
    };
    eventType?: {
        name: string;
    };
    customEventType?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    adults: number;
    children: number;
    toddlers: number;
    guests: number;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    totalPrice: number;
    status: string;
    notes?: string;
    birthdayAge?: number;
    anniversaryYear?: number;
    anniversaryOccasion?: string;
    deposit?: {
        amount: number;
        dueDate: string;
        status: string;
        paid: boolean;
    };
    deposits?: Array<{
        amount: number;
        dueDate: Date | string;
        status: string;
        paid: boolean;
    }>;
    menuData?: MenuData;
    menuSnapshot?: MenuSnapshot;
    createdAt: Date;
}
interface PaymentConfirmationData {
    depositId: string;
    amount: number;
    paidAt: Date;
    paymentMethod: string;
    paymentReference?: string;
    client: {
        firstName: string;
        lastName: string;
        email?: string;
        phone: string;
        address?: string;
    };
    reservation: {
        id: string;
        date: string;
        startTime: string;
        endTime: string;
        hall?: string;
        eventType?: string;
        guests: number;
        totalPrice: number;
    };
}
interface MenuCardDish {
    name: string;
    description?: string | null;
    allergens?: string[];
    isDefault?: boolean;
    isRecommended?: boolean;
}
interface MenuCardCourse {
    name: string;
    description?: string | null;
    icon?: string | null;
    minSelect: number;
    maxSelect: number;
    dishes: MenuCardDish[];
}
interface MenuCardOption {
    name: string;
    description?: string | null;
    category: string;
    priceType: string;
    priceAmount: number;
    isRequired?: boolean;
}
interface MenuCardPackage {
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    isPopular?: boolean;
    isRecommended?: boolean;
    badgeText?: string | null;
    includedItems?: string[];
    courses: MenuCardCourse[];
    options: MenuCardOption[];
}
export interface MenuCardPDFData {
    templateName: string;
    templateDescription?: string | null;
    variant?: string | null;
    eventTypeName: string;
    eventTypeColor?: string | null;
    packages: MenuCardPackage[];
}
export declare class PDFService {
    private readonly FONT_PATHS;
    private useCustomFonts;
    private fontRegular?;
    private fontBold?;
    private restaurantData;
    constructor();
    private checkFontsAvailability;
    private setupFonts;
    generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer>;
    generatePaymentConfirmationPDF(data: PaymentConfirmationData): Promise<Buffer>;
    generateMenuCardPDF(data: MenuCardPDFData): Promise<Buffer>;
    private buildPDFContent;
    private buildPaymentConfirmationContent;
    private buildMenuCardContent;
    private addMenuSelectionSection;
    private addMenuSelectionSectionLegacy;
    private addHeader;
    private addSeparator;
    private addStatusBadge;
    private addFooter;
    private getRegularFont;
    private getBoldFont;
    private formatDate;
    private formatTime;
    private formatDateTime;
    private formatCurrency;
}
export declare const pdfService: PDFService;
export {};
//# sourceMappingURL=pdf.service.d.ts.map