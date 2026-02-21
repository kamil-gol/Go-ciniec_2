/**
 * Menu Calculator DTOs
 *
 * Data Transfer Objects for menu price calculation
 */
export declare class SelectedOptionDto {
    optionId: string;
    quantity: number;
    customPrice?: number;
}
export declare class MenuCalculatorRequestDto {
    packageId: string;
    adults: number;
    children: number;
    toddlers: number;
    selectedOptions?: SelectedOptionDto[];
}
export declare class PriceBreakdownDto {
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    adultsCount: number;
    childrenCount: number;
    toddlersCount: number;
    adultsSubtotal: number;
    childrenSubtotal: number;
    toddlersSubtotal: number;
    packageTotal: number;
}
export declare class OptionPriceDetailDto {
    optionId: string;
    name: string;
    category: string;
    priceType: string;
    priceAmount: number;
    quantity: number;
    calculatedPrice: number;
}
export declare class MenuCalculatorResponseDto {
    packageId: string;
    packageName: string;
    priceBreakdown: PriceBreakdownDto;
    optionsDetails: OptionPriceDetailDto[];
    optionsTotal: number;
    totalGuests: number;
    grandTotal: number;
    averagePerGuest: number;
    warnings?: string[];
}
//# sourceMappingURL=menu-calculator.dto.d.ts.map