/**
 * Menu Selection DTOs
 * 
 * Data Transfer Objects for menu selection and reservation menu management
 * Updated: #166 — Added portionTarget to dishSelections in MenuSnapshotData
 */

/**
 * Individual dish selection with quantity
 */
export interface DishSelectionDTO {
  dishId: string;
  quantity: number; // Can be 0.5, 1, 1.5, 2, etc.
}

/**
 * Category with selected dishes
 */
export interface CategorySelectionDTO {
  categoryId: string;
  dishes: DishSelectionDTO[];
}

/**
 * Selected menu option with quantity.
 * Required: optionId + quantity.
 * Optional fields are used by snapshot/service enrichment.
 */
export interface SelectedOptionDTO {
  optionId: string;
  quantity: number;
  name?: string;
  description?: string | null;
  category?: string;
  priceType?: 'PER_PERSON' | 'FLAT' | 'FREE';
  priceAmount?: number;
  icon?: string | null;
}

/**
 * Main input for menu selection (POST /reservations/:id/menu)
 */
export interface MenuSelectionInput {
  packageId: string;
  
  // NEW: Dish selections grouped by category
  dishSelections?: CategorySelectionDTO[];
  
  // Optional additional menu options (e.g., DJ, decorations, alcohol)
  selectedOptions?: SelectedOptionDTO[];
  
  // Guest counts (optional - can be updated separately)
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
  // Package info
  packageId: string;
  packageName: string;
  packageDescription?: string;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  
  // Guest counts
  adults: number;
  children: number;
  toddlers: number;
  
  // NEW: Selected dishes with categories
  // #166: portionTarget determines which guests this category feeds
  dishSelections?: {
    categoryId: string;
    categoryName: string;
    portionTarget?: 'ALL' | 'ADULTS_ONLY' | 'CHILDREN_ONLY';
    dishes: {
      dishId: string;
      dishName: string;
      description?: string;
      quantity: number;
      allergens?: string[];
    }[];
  }[];
  
  // Selected options
  selectedOptions?: {
    optionId: string;
    optionName: string;
    category: string;
    quantity: number;
    priceAmount: number;
    priceUnit: string;
  }[];
  
  // Price breakdown
  prices: {
    packageTotal: number;
    optionsTotal: number;
    total: number;
  };
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
}
