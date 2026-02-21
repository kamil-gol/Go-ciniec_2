/**
 * Menu Selection DTOs
 *
 * Data Transfer Objects for menu selection and reservation menu management
 */
/**
 * Individual dish selection with quantity
 */
export interface DishSelectionDTO {
    dishId: string;
    quantity: number;
}
/**
 * Category with selected dishes
 */
export interface CategorySelectionDTO {
    categoryId: string;
    dishes: DishSelectionDTO[];
}
/**
 * Selected menu option with quantity
 */
export interface SelectedOptionDTO {
    optionId: string;
    quantity: number;
}
/**
 * Main input for menu selection (POST /reservations/:id/menu)
 */
export interface MenuSelectionInput {
    packageId: string;
    dishSelections?: CategorySelectionDTO[];
    selectedOptions?: SelectedOptionDTO[];
    adults?: number;
    children?: number;
    toddlers?: number;
}
/**
 * Update guest counts (PUT /reservations/:id/menu/guests)
 */
export interface UpdateGuestCountsDTO {
    adults: number;
    children: number;
    toddlers: number;
}
/**
 * Menu snapshot saved in database (JSONB field)
 */
export interface MenuSnapshotData {
    packageId: string;
    packageName: string;
    packageDescription?: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    adults: number;
    children: number;
    toddlers: number;
    dishSelections?: {
        categoryId: string;
        categoryName: string;
        dishes: {
            dishId: string;
            dishName: string;
            description?: string;
            quantity: number;
            allergens?: string[];
        }[];
    }[];
    selectedOptions?: {
        optionId: string;
        optionName: string;
        category: string;
        quantity: number;
        priceAmount: number;
        priceUnit: string;
    }[];
    prices: {
        packageTotal: number;
        optionsTotal: number;
        total: number;
    };
    createdAt: string;
    updatedAt?: string;
}
//# sourceMappingURL=menu-selection.dto.d.ts.map